import type { FirebaseApp } from 'firebase/app';
import type { Firestore, QueryDocumentSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const galleryEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/* Firestore always returns whole documents, so the gallery splits each marble
   in two: a small thumbnail lives inline in `marbles/{id}` (what the grid
   fetches), and the full-size image in the subdocument
   `marbles/{id}/image/full`, fetched only when the lightbox opens. Documents
   published before this split carry the full image inline in `image` — reads
   treat that as both thumb and full. */

export interface Marble {
  id: string;
  thumb: string;
  /** Full-size image if already known (old-schema docs); otherwise load via fetchFullImage. */
  full: string | null;
  palette: string;
  owner: string;
  createdAt: number;
}

export interface MarblePage {
  uid: string;
  marbles: Marble[];
  /** Opaque cursor for the next page; null when this was the last page. */
  cursor: QueryDocumentSnapshot | null;
}

// Firebase loads on first use so it never weighs down the initial canvas paint.
let appPromise: Promise<FirebaseApp> | null = null;
let dbPromise: Promise<Firestore> | null = null;
let uid: string | null = null;
let signInFlight: Promise<string> | null = null;

// App Check (optional): proves requests come from this app rather than a
// script, which matters because the gallery collection is publicly writable.
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import('firebase/app');
      const app = initializeApp(firebaseConfig);
      if (appCheckSiteKey) {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
      return app;
    })();
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

// Grid tiles render at ~150px, so a 320px JPEG is plenty and ~10× lighter
// than shipping the full image to every gallery visitor.
export async function makeThumb(dataUrl: string, maxWidth = 320, quality = 0.7): Promise<string> {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('Could not decode the image'));
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxWidth / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', quality);
}

export async function publishMarble(image: string, palette: string) {
  const db = await getDb();
  const owner = await getUid();
  const thumb = await makeThumb(image);
  const { collection, doc, writeBatch, serverTimestamp } = await import('firebase/firestore');
  const ref = doc(collection(db, 'marbles'));
  const batch = writeBatch(db);
  batch.set(ref, { thumb, palette, owner, createdAt: serverTimestamp() });
  batch.set(doc(ref, 'image', 'full'), { image, owner });
  await batch.commit();
}

// Parent deletes don't cascade in Firestore, so the full-image subdocument is
// deleted explicitly (a no-op for old-schema marbles that never had one).
export async function deleteMarble(id: string) {
  const db = await getDb();
  await getUid();
  const { doc, writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  batch.delete(doc(db, 'marbles', id));
  batch.delete(doc(db, 'marbles', id, 'image', 'full'));
  await batch.commit();
}

export async function fetchFullImage(id: string): Promise<string | null> {
  const db = await getDb();
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'marbles', id, 'image', 'full'));
  return (snap.data() as { image?: string } | undefined)?.image ?? null;
}

interface MarbleDoc {
  thumb?: string;
  image?: string;
  palette?: string;
  owner?: string;
  createdAt?: { toMillis(): number };
}

function toMarble(id: string, data: MarbleDoc): Marble {
  return {
    id,
    thumb: data.thumb ?? data.image ?? '',
    full: data.image ?? null,
    palette: data.palette ?? '',
    owner: data.owner ?? '',
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
  };
}

/** Single marble lookup for ?m= share links. */
export async function fetchMarble(id: string): Promise<Marble | null> {
  const db = await getDb();
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'marbles', id));
  return snap.exists() ? toMarble(snap.id, snap.data() as MarbleDoc) : null;
}

export async function fetchMarbles(pageSize = 12, cursor?: QueryDocumentSnapshot | null): Promise<MarblePage> {
  const db = await getDb();
  // Best-effort: browsing must work even if Anonymous sign-in isn't enabled yet.
  const me = await getUid().catch(() => '');
  const { collection, getDocs, query, orderBy, startAfter, limit } = await import('firebase/firestore');

  const q = cursor
    ? query(collection(db, 'marbles'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'marbles'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);

  return {
    uid: me,
    marbles: snap.docs.map(d => toMarble(d.id, d.data() as MarbleDoc)),
    cursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null,
  };
}
