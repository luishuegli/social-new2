'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../Lib/firebase';
import { useRouter } from 'next/navigation';
import { db } from '../Lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ExtendedUser extends User {
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  firebaseUser: User | null; // Original Firebase user for getIdToken()
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: { displayName?: string; photoURL?: string; profilePictureUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    console.log('AuthProvider: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthProvider: Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      
      if (firebaseUser) {
        // Store the original Firebase user for getIdToken()
        setFirebaseUser(firebaseUser);
        
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          // Create extended user object with Firestore data
          const extendedUser = {
            ...firebaseUser,
            profilePictureUrl: userData?.profilePictureUrl
          } as ExtendedUser;
          
          setUser(extendedUser);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(firebaseUser as ExtendedUser);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('AuthProvider: Auth state error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // New accounts must complete onboarding
      router.push('/onboarding');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user?.uid;
      if (uid) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          // No profile yet → go to onboarding
          router.push('/onboarding');
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // After logout, send user to sign-in
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string; profilePictureUrl?: string }) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Update Firebase Auth profile (only for displayName and photoURL if provided)
      const firebaseProfile: { displayName?: string; photoURL?: string } = {};
      if (profile.displayName !== undefined) firebaseProfile.displayName = profile.displayName;
      if (profile.photoURL !== undefined) firebaseProfile.photoURL = profile.photoURL;
      
      if (Object.keys(firebaseProfile).length > 0) {
        await updateProfile(user, firebaseProfile);
        await user.reload();
      }
      
      // Update local user state with profilePictureUrl
      const updatedUser = {
        ...user,
        profilePictureUrl: profile.profilePictureUrl || user.profilePictureUrl
      } as ExtendedUser;
      
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateProfile: updateUserProfile,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-background-primary" />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 