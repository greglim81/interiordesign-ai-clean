'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PhotoUpload from '@/components/PhotoUpload';
import StyleSelector from '@/components/StyleSelector';
import { TransformOptions, TransformProgress } from '@/types/transform';
import { saveTransformationHistory } from '@/lib/firestore';
import Image from 'next/image';
import SubscriptionStatus from '@/components/SubscriptionStatus';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformOptions, setTransformOptions] = useState<TransformOptions>({
    style: 'modern'
  });
  const [progress, setProgress] = useState<TransformProgress>({
    status: 'starting',
    progress: 0,
    message: 'Ready to transform'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handleImageUpload = (imageUrl: string) => {
    setOriginalImage(imageUrl);
    setTransformedImage(null);
    setError(null);
    setProgress({
      status: 'starting',
      progress: 0,
      message: 'Image uploaded successfully'
    });
  };

  const handleTransform = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);
    setProgress({
      status: 'processing',
      progress: 0,
      message: 'Starting transformation...'
    });

    try {
      console.log('Sending transform request with:', {
        imageUrl: originalImage,
        options: transformOptions
      });

      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: originalImage,
          options: transformOptions
        }),
      });

      console.log('Transform response status:', response.status);
      const data = await response.json();
      console.log('Transform response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transform image');
      }

      setTransformedImage(data.transformedImageUrl);
      setProgress(data.progress);

      // Save to Firestore
      if (user) {
        await saveTransformationHistory(user.uid, {
          originalImage,
          transformedImage: data.transformedImageUrl,
          style: transformOptions.style,
          date: Date.now(),
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Transform error:', err);
        setError(err.message);
        setProgress({
          status: 'failed',
          progress: 0,
          message: err.message
        });
      } else {
        setError('Failed to transform image');
        setProgress({
          status: 'failed',
          progress: 0,
          message: 'Failed to transform image'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Room Transformation
          </h1>
          <p className="text-gray-600">
            Upload a photo of your room and transform it with AI
          </p>
        </div>

        <SubscriptionStatus />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PhotoUpload onUpload={handleImageUpload} disabled={isProcessing} />
            
            {originalImage && (
              <div className="space-y-4">
                <StyleSelector
                  onOptionsChange={setTransformOptions}
                  disabled={isProcessing}
                />
                
                <button
                  onClick={handleTransform}
                  disabled={isProcessing || !originalImage}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium
                    ${isProcessing || !originalImage
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                    }
                  `}
                >
                  {isProcessing ? 'Transforming...' : 'Transform Room'}
                </button>

                {progress && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{progress.message}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300
                          ${progress.status === 'failed' ? 'bg-red-500' :
                            progress.status === 'succeeded' ? 'bg-green-500' :
                            'bg-blue-500'
                          }
                        `}
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {originalImage && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Original Room</h2>
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={originalImage}
                    alt="Original room"
                    className="object-cover w-full h-full"
                    width={400}
                    height={225}
                  />
                </div>
              </div>
            )}

            {transformedImage && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Transformed Room</h2>
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={transformedImage}
                    alt="Transformed room"
                    className="object-cover w-full h-full"
                    width={400}
                    height={225}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
