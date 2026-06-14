import type { FirebaseApp } from 'firebase/app';
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
  owner: string;
  createdAt: number;
}

// Firebase loads on first use so it never weighs down the initial canvas paint.
let appPromise: Promise<FirebaseApp> | null = null;
let dbPromise: Promise<Firestore> | null = null;
let uid: string | null = null;
let signInFlight: Promise<string> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp }) => initializeApp(firebaseConfig));
  }
  return appPromise;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { getFirestore } = await import('firebase/firestore');
      return getFirestore(await getApp());
    })();
  }
  return dbPromise;
}

// An invisible per-browser identity (Firebase Anonymous Auth) so a marble can
// be owned and only its owner can delete it. Retries on failure so enabling
// Anonymous sign-in in the console takes effect without a reload.
async function getUid(): Promise<string> {
  if (uid) return uid;
  if (!signInFlight) {
    signInFlight = (async () => {
      const { getAuth, signInAnonymously } = await import('firebase/auth');
      const cred = await signInAnonymously(getAuth(await getApp()));
      uid = cred.user.uid;
      signInFlight = null;
      return uid;
    })().catch(e => { signInFlight = null; throw e; });
  }
  return signInFlight;
}

export async function publishMarble(image: string, palette: string) {
  const db = await getDb();
  const owner = await getUid();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'marbles'), { image, palette, owner, createdAt: serverTimestamp() });
}

export async function deleteMarble(id: string) {
  const db = await getDb();
  await getUid();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'marbles', id));
}

export async function fetchMarbles(max = 24): Promise<{ uid: string; marbles: Marble[] }> {
  const db = await getDb();
  // Best-effort: browsing must work even if Anonymous sign-in isn't enabled yet.
  const me = await getUid().catch(() => '');
  const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

  const snap = await getDocs(query(collection(db, 'marbles'), orderBy('createdAt', 'desc'), limit(max)));
  const marbles = snap.docs.map(d => {
    const data = d.data() as { image: string; palette?: string; owner?: string; createdAt?: { toMillis(): number } };
    return {
      id: d.id,
      url: data.image,
      palette: data.palette ?? '',
      owner: data.owner ?? '',
      createdAt: data.createdAt?.toMillis() ?? Date.now(),
    };
  });
  return { uid: me, marbles };
}
