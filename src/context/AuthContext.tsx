import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Role } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string, email: string | null) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData({ id: docSnap.id, ...docSnap.data() } as User);
      } else {
        // If it's the admin, self-bootstrap
        if (email === 'wongph@twghkywc.edu.hk') {
          const newAdmin: Omit<User, 'id'> = {
            email: email,
            name: 'Admin',
            role: 'admin',
            isActive: true,
            createdAt: Date.now()
          };
          await setDoc(docRef, newAdmin);
          setUserData({ id: uid, ...newAdmin } as User);
        } else {
          setUserData(null);
        }
      }
    } catch (err) {
      console.error("Error fetching user data", err);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        await fetchUserData(user.uid, user.email);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid, currentUser.email);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, refreshUserData }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="text-xl text-slate-500 font-semibold flex flex-col items-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            系統載入中... (Loading...)
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
