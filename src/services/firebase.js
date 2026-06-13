import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

// .env에 잘못된 형식으로 업로드된 것을 방지하기 위해 하드코딩된 설정 사용 (학생용 앱이라 클라이언트 공개키여도 무방함)
const firebaseConfig = {
  apiKey: "AIzaSyCutWcSkAV0rTOUgVrJH7pZO6e5i5W8PmE",
  authDomain: "stock-61b7e.firebaseapp.com",
  projectId: "stock-61b7e",
  storageBucket: "stock-61b7e.firebasestorage.app",
  messagingSenderId: "1082901164521",
  appId: "1:1082901164521:web:fe0d144631057f568a5b78",
  measurementId: "G-5L1H1GH5JT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

/**
 * 회원가입 (계좌 개설)
 */
export const signUpUser = async (userId, password, nickname) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: false, message: "이미 존재하는 아이디입니다." };
    }

    // 초기 데이터베이스 생성
    const initialData = {
      userId,
      password,
      nickname,
      balance: 10000000, // 1000만원 시작
      portfolio: {},
      totalValue: 10000000,
      returnPct: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await setDoc(userRef, initialData);
    return { success: true, data: initialData };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, message: "계좌 개설 중 오류가 발생했습니다." };
  }
};

/**
 * 로그인
 */
export const loginUser = async (userId, password) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, message: "존재하지 않는 아이디입니다." };
    }

    const userData = userSnap.data();
    if (userData.password !== password) {
      return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    return { success: true, data: userData };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "로그인 중 오류가 발생했습니다." };
  }
};

/**
 * 포트폴리오 및 자산 업데이트 (매수/매도 시 즉시 저장)
 */
export const updatePortfolioToDB = async (userId, balance, portfolio, totalValue, returnPct) => {
  if (!db || !userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      balance,
      portfolio,
      totalValue,
      returnPct,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving portfolio to DB:", error);
  }
};

/**
 * 단순 랭킹 업데이트 (대시보드 실시간 갱신용)
 */
export const syncUserData = async (userId, totalValue, returnPct) => {
  if (!db || !userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      totalValue,
      returnPct,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing user data:", error);
  }
};

/**
 * 명예의 전당 구독 (Top 50)
 */
export const subscribeToLeaderboard = (callback) => {
  if (!db) {
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
