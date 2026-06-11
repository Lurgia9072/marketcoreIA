import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const saveOrUpdateUser = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const now = new Date().toISOString();

      if (userSnap.exists()) {
        // User already exists, update lastLogin only
        await updateDoc(userRef, {
          lastLogin: now,
          displayName: firebaseUser.displayName || userSnap.data().displayName,
          photoURL: firebaseUser.photoURL || userSnap.data().photoURL,
        });

        const updatedData = {
          ...userSnap.data(),
          lastLogin: now,
        } as UserProfile;

        setUser(updatedData);
      } else {
        // Create a new user profile record
        const newUser: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Emprendedor',
          photoURL: firebaseUser.photoURL || '',
          createdAt: now,
          lastLogin: now,
          plan: 'free',
          trial: true,
        };

        await setDoc(userRef, newUser);
        setUser(newUser);
      }
    } catch (err) {
      console.error("Error creating/updating user profile in Firestore:", err);
      // Fallback to local profile state even if firestore write fails/times out
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Emprendedor',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        plan: 'free',
        trial: true
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await saveOrUpdateUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await saveOrUpdateUser(result.user);
      }
    } catch (err) {
      console.error("Popup authentication failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono tracking-wider text-slate-400">CARGANDO SESIÓN...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
