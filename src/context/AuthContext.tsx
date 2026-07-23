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
      {!loading && children}
    </AuthContext.Provider>
  );
};
