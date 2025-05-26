import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface SubscriptionData {
  isSubscribed: boolean;
  trialEndsAt: number | null;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
}

export async function initializeUserSubscription(userId: string) {
  const trialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
  
  await setDoc(doc(db, 'subscriptions', userId), {
    isSubscribed: false,
    trialEndsAt,
    stripeCustomerId: null,
    subscriptionId: null,
  });
}

export async function getUserSubscription(userId: string): Promise<SubscriptionData> {
  const docRef = doc(db, 'subscriptions', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return {
      isSubscribed: false,
      trialEndsAt: null,
      stripeCustomerId: null,
      subscriptionId: null,
    };
  }
  
  return docSnap.data() as SubscriptionData;
}

export async function getDaysLeftInTrial(userId: string): Promise<number | null> {
  const subscription = await getUserSubscription(userId);
  
  if (subscription.isSubscribed || !subscription.trialEndsAt) {
    return null;
  }
  
  const now = Date.now();
  const daysLeft = Math.ceil((subscription.trialEndsAt - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, daysLeft);
}

export async function createCheckoutSession(userId: string) {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const { sessionId } = await response.json();
  
  if (!sessionId) {
    throw new Error('No session ID received from server');
  }

  const stripe = await stripePromise;
  
  if (!stripe) {
    throw new Error('Stripe failed to initialize');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });
  
  if (error) {
    throw error;
  }
}

export async function updateSubscriptionStatus(userId: string, stripeCustomerId: string, subscriptionId: string) {
  const docRef = doc(db, 'subscriptions', userId);
  await updateDoc(docRef, {
    isSubscribed: true,
    stripeCustomerId,
    subscriptionId,
  });
} 