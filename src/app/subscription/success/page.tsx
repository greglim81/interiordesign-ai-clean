'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !sessionId) {
      router.push('/');
      return;
    }

    // Verify the session with Stripe
    const verifySession = async () => {
      try {
        const response = await fetch('/api/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify session');
        }

        // Redirect to home page after successful verification
        router.push('/');
      } catch (err) {
        console.error('Failed to verify session:', err);
        setError('Failed to verify your subscription. Please contact support.');
      }
    };

    verifySession();
  }, [user, sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing your subscription...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your subscription.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 