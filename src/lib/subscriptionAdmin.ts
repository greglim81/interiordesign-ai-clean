// src/lib/subscriptionAdmin.ts

import { adminFirestore } from './firebaseAdmin';

export async function updateSubscriptionStatusAdmin(
  userId: string,
  stripeCustomerId: string,
  subscriptionId: string
) {
  const docRef = adminFirestore.collection('subscriptions').doc(userId);
  await docRef.update({
    isSubscribed: true,
    stripeCustomerId,
    subscriptionId,
  });
}