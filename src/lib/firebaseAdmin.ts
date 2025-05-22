import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

let adminApp: App;

if (!getApps().length) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    const serviceAccount = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
        : fs.readFileSync('./interior-ai-f3382-firebase-adminsdk-fbsvc-708f4921b3.json', 'utf8')
    );
    console.log('Service account loaded successfully');
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

export const adminStorage = getStorage(adminApp);
export const adminFirestore = getFirestore(adminApp); 