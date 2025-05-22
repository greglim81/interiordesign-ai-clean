import { getFirestore, collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);

export interface TransformationHistoryItem {
  originalImage: string;
  transformedImage: string;
  style: string;
  date: number;
}

export async function saveTransformationHistory(userId: string, item: TransformationHistoryItem) {
  await addDoc(collection(db, 'users', userId, 'history'), item);
}

export async function fetchTransformationHistory(userId: string): Promise<TransformationHistoryItem[]> {
  const q = query(collection(db, 'users', userId, 'history'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as TransformationHistoryItem);
} 