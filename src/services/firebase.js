import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize only if config is provided
let app;
let db = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase config is missing. Leaderboard will be disabled or mocked.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { db };

// Sync user data to Firestore
export const syncUserData = async (nickname, totalValue, returnPct) => {
  if (!db || !nickname) return;
  
  try {
    const userRef = doc(db, 'users', nickname);
    await setDoc(userRef, {
      nickname,
      totalValue,
      returnPct,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing user data:", error);
  }
};

// Subscribe to leaderboard top 50
export const subscribeToLeaderboard = (callback) => {
  if (!db) {
    // Return a mock callback if Firebase isn't configured
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'users'),
    orderBy('totalValue', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    callback(data);
  }, (error) => {
    console.error("Leaderboard subscription error:", error);
    callback([]);
  });

  return unsubscribe;
};
