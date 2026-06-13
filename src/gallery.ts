import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const galleryEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export interface Marble {
  id: string;
  url: string;
  palette: string;
  createdAt: number;
}

// Firebase loads on first use so it never weighs down the initial canvas paint.
let dbPromise: Promise<Firestore> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      return getFirestore(initializeApp(firebaseConfig));
    })();
  }
  return dbPromise;
}

// The preview image is stored inline as a data URL — keeps the gallery on
// Firebase's free tier (Storage now requires a paid plan).
export async function publishMarble(image: string, palette: string) {
  const db = await getDb();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'marbles'), { image, palette, createdAt: serverTimestamp() });
}

export async function fetchMarbles(max = 24): Promise<Marble[]> {
  const db = await getDb();
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

  const snap = await getDocs(query(collection(db, 'marbles'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(d => {
    const data = d.data() as { image: string; palette?: string; createdAt?: { toMillis(): number } };
    return {
      id: d.id,
      url: data.image,
      palette: data.palette ?? '',
      createdAt: data.createdAt?.toMillis() ?? Date.now(),
    };
  });
}
