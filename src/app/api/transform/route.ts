import { NextResponse } from 'next/server';
import { STYLE_PRESETS, TransformOptions, TransformProgress } from '@/types/transform';

export const dynamic = 'force-dynamic';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string[];
  error?: string;
  logs?: string;
}

export async function POST(request: Request) {
  try {
    console.log('Transform API called');
    const { imageUrl, options } = await request.json() as { imageUrl: string; options: TransformOptions };
    console.log('Request data:', { imageUrl, options });

    if (!imageUrl) {
      console.log('No image URL provided');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('No Replicate API token configured');
      return NextResponse.json(
        { error: 'Replicate API token is not configured' },
        { status: 500 }
      );
    }

    const styleConfig = STYLE_PRESETS[options.style];
    if (!styleConfig) {
      console.log('Invalid style preset:', options.style);
      return NextResponse.json(
        { error: 'Invalid style preset' },
        { status: 400 }
      );
    }

    console.log('Creating prediction with Replicate...');
    // Create prediction
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
      throw new Error(getErrorMessage(error.detail || 'Failed to create prediction'));
    }

    const prediction = await createResponse.json() as ReplicatePrediction;
    console.log('Replicate prediction response:', prediction);
    
    // Support both string and array output
    let outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;

    if (prediction.status === 'succeeded' && outputUrl) {
      return NextResponse.json({ 
        transformedImageUrl: outputUrl,
        progress: {
          status: 'succeeded',
          progress: 100,
          message: 'Transformation completed successfully'
        }
      });
    }
    
    // If not, poll for the result
    const result = await pollForResult(prediction.id);
    console.log('Replicate poll result:', result);
    let resultOutputUrl = Array.isArray(result.output)
      ? result.output[0]
      : result.output;
    
    if (!resultOutputUrl) {
      throw new Error('No output image generated');
    }

    return NextResponse.json({ 
      transformedImageUrl: resultOutputUrl,
      progress: {
        status: 'succeeded',
        progress: 100,
        message: 'Transformation completed successfully'
      }
    });
  } catch (error: any) {
    console.error('Error in transform API:', error);
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