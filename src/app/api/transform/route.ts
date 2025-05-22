import { NextResponse } from 'next/server';
import { STYLE_PRESETS, TransformOptions } from '@/types/transform';
import { adminStorage } from '@/lib/firebaseAdmin';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string[] | string;
  error?: string;
  logs?: string;
}

async function uploadImageToFirebaseStorage(imageUrl: string): Promise<string> {
  try {
    console.log('Downloading image from Replicate:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to download image:', response.status, response.statusText);
      throw new Error('Failed to download transformed image');
    }
    const buffer = await response.buffer();
    console.log('Image downloaded successfully');
    const filename = `transformed/${uuidv4()}.png`;
    console.log('Uploading to Firebase Storage:', filename);
    const bucket = adminStorage.bucket();
    const file = bucket.file(filename);
    await file.save(buffer, {
      contentType: 'image/png',
      public: true,
      metadata: { cacheControl: 'public,max-age=31536000' },
    });
    console.log('Image uploaded to Firebase Storage successfully');
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in uploadImageToFirebaseStorage:', error.message);
      throw error;
    } else {
      console.error('Unknown error in uploadImageToFirebaseStorage');
      throw new Error('Unknown error in uploadImageToFirebaseStorage');
    }
  }
}

export async function POST(request: Request) {
  try {
    console.log('Received transform request');
    const { imageUrl, options } = await request.json() as { imageUrl: string; options: TransformOptions };
    console.log('Request data:', { imageUrl, options });
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('Replicate API token is not configured');
      return NextResponse.json(
        { error: 'Replicate API token is not configured' },
        { status: 500 }
      );
    }
    const styleConfig = STYLE_PRESETS[options.style];
    if (!styleConfig) {
      return NextResponse.json(
        { error: 'Invalid style preset' },
        { status: 400 }
      );
    }
    console.log('Creating Replicate prediction...');
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        version: "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input: {
          image: imageUrl,
          prompt: options.customPrompt || styleConfig.prompt,
          guidance_scale: options.guidanceScale || styleConfig.guidance_scale,
          negative_prompt: options.customNegativePrompt || styleConfig.negative_prompt,
          prompt_strength: options.promptStrength || styleConfig.prompt_strength,
          num_inference_steps: options.numInferenceSteps || 50
        },
      }),
    });
    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('Replicate API error:', error);
      throw new Error(getErrorMessage((error as { detail?: string }).detail || 'Failed to create prediction'));
    }
    const prediction = await createResponse.json() as ReplicatePrediction;
    console.log('Prediction created:', prediction);
    const outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (prediction.status === 'succeeded' && outputUrl) {
      console.log('Prediction succeeded immediately, uploading to Firebase Storage...');
      const firebaseUrl = await uploadImageToFirebaseStorage(outputUrl);
      return NextResponse.json({ 
        transformedImageUrl: firebaseUrl,
        progress: {
          status: 'succeeded',
          progress: 100,
          message: 'Transformation completed successfully'
        }
      });
    }
    console.log('Polling for prediction result...');
    const result = await pollForResult(prediction.id);
    const resultOutputUrl = Array.isArray(result.output)
      ? result.output[0]
      : result.output;
    if (!resultOutputUrl) {
      throw new Error('No output image generated');
    }
    console.log('Prediction completed, uploading to Firebase Storage...');
    const firebaseUrl = await uploadImageToFirebaseStorage(resultOutputUrl);
    return NextResponse.json({ 
      transformedImageUrl: firebaseUrl,
      progress: {
        status: 'succeeded',
        progress: 100,
        message: 'Transformation completed successfully'
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in transform API:', error.message);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to transform image',
          progress: {
            status: 'failed',
            progress: 0,
            message: error.message || 'Failed to transform image'
          }
        },
        { status: 500 }
      );
    } else {
      console.error('Unknown error in transform API');
      return NextResponse.json(
        { 
          error: 'Unknown error in transform API',
          progress: {
            status: 'failed',
            progress: 0,
            message: 'Unknown error in transform API'
          }
        },
        { status: 500 }
      );
    }
  }
}

async function pollForResult(predictionId: string): Promise<ReplicatePrediction> {
  const maxAttempts = 30;
  const interval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(getErrorMessage(error.detail || 'Failed to get prediction status'));
    }

    const prediction = await response.json() as ReplicatePrediction;

    if (prediction.status === 'succeeded') {
      return prediction;
    } else if (prediction.status === 'failed') {
      throw new Error(getErrorMessage(prediction.error || 'Prediction failed'));
    } else if (prediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Prediction timed out');
}

function getErrorMessage(error: string): string {
  // Map common Replicate API errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Invalid input': 'The uploaded image is not valid or is in an unsupported format',
    'Rate limit exceeded': 'Too many requests. Please try again in a few minutes',
    'Insufficient credits': 'Your account has insufficient credits to process this request',
    'Model not found': 'The transformation model is currently unavailable',
    'Invalid API token': 'The API token is invalid or has expired',
    'Input validation failed': 'The image or transformation options are invalid',
  };

  return errorMap[error] || error;
} 