import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const galleryEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.storageBucket,
);

export interface Marble {
  id: string;
  url: string;
  palette: string;
  createdAt: number;
}

// Firebase loads on first use so it never weighs down the initial canvas paint.
let services: Promise<{ db: Firestore; storage: FirebaseStorage }> | null = null;

function getServices() {
  if (!services) {
    services = (async () => {
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const { getStorage } = await import('firebase/storage');
      const app = initializeApp(firebaseConfig);
      return { db: getFirestore(app), storage: getStorage(app) };
    })();
  }
  return services;
}

export async function publishMarble(blob: Blob, palette: string) {
  const { db, storage } = await getServices();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const imgRef = ref(storage, `marbles/${id}.png`);
  await uploadBytes(imgRef, blob, { contentType: 'image/png' });
  const url = await getDownloadURL(imgRef);
  await addDoc(collection(db, 'marbles'), { url, palette, createdAt: serverTimestamp() });
}

export async function fetchMarbles(max = 24): Promise<Marble[]> {
  const { db } = await getServices();
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

  const snap = await getDocs(query(collection(db, 'marbles'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(d => {
    const data = d.data() as { url: string; palette?: string; createdAt?: { toMillis(): number } };
    return {
      id: d.id,
      url: data.url,
      palette: data.palette ?? '',
      createdAt: data.createdAt?.toMillis() ?? Date.now(),
    };
  });
}
