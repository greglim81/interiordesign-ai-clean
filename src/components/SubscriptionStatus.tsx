import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDaysLeftInTrial, createCheckoutSession } from '@/lib/subscription';

export default function SubscriptionStatus() {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getDaysLeftInTrial(user.uid).then(setDaysLeft);
    }
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await createCheckoutSession(user.uid);
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || daysLeft === null) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      {daysLeft > 0 ? (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </h3>
          <p className="text-gray-600 mb-4">
            Subscribe now to continue using all features after your trial ends
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Subscribe Now'}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your trial has ended
          </h3>
          <p className="text-gray-600 mb-4">
            Subscribe now to continue using all features
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Subscribe Now'}
          </button>
        </div>
      )}
    </div>
  );
} 