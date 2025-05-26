'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionCancel() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Subscription Cancelled
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your subscription process was cancelled. You will be redirected to the home page.
          </p>
        </div>
      </div>
    </div>
  );
} 