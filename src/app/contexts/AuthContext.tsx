'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
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
    logger.debug('Setting up auth state listener', undefined, 'AuthProvider');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.debug('Auth state changed', { hasUser: !!firebaseUser }, 'AuthProvider');
      
      if (firebaseUser) {
        // Store the original Firebase user for getIdToken()
        setFirebaseUser(firebaseUser);
        
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          // If user doesn't have profile data, ensure they do
          if (!userData) {
            logger.info('User has no Firestore profile data, creating profile...', { uid: firebaseUser.uid }, 'AuthProvider');
            try {
              const token = await firebaseUser.getIdToken();
              const response = await fetch('/api/ensure-user-profile', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                // Re-fetch the user data after ensuring profile exists
                const updatedUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                const updatedUserData = updatedUserDoc.data();
                
                logger.info('User profile created/updated', { uid: firebaseUser.uid }, 'AuthProvider');
                
                const extendedUser = {
                  ...firebaseUser,
                  profilePictureUrl: updatedUserData?.profilePictureUrl
                } as ExtendedUser;
                
                setUser(extendedUser);
              } else {
                const errorText = await response.text();
                logger.error('Failed to create user profile', { error: errorText }, 'AuthProvider');
                setUser(firebaseUser as ExtendedUser);
              }
            } catch (profileError) {
              logger.error('Error ensuring user profile', profileError, 'AuthProvider');
              setUser(firebaseUser as ExtendedUser);
            }
          } else {
            logger.debug('User has existing Firestore profile data', { uid: firebaseUser.uid }, 'AuthProvider');
            // Create extended user object with Firestore data
            const extendedUser = {
              ...firebaseUser,
              profilePictureUrl: userData?.profilePictureUrl
            } as ExtendedUser;
            
            setUser(extendedUser);
          }
        } catch (error) {
          logger.error('Error fetching user profile', error, 'AuthProvider');
          setUser(firebaseUser as ExtendedUser);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      
      setLoading(false);
    }, (error) => {
      logger.error('Auth state error', error, 'AuthProvider');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logger.error('Sign in error', error, 'AuthProvider');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // New accounts must complete onboarding
      router.push('/onboarding');
    } catch (error) {
      logger.error('Sign up error', error, 'AuthProvider');
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
      logger.error('Google sign in error', error, 'AuthProvider');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // After logout, send user to sign-in
      router.push('/');
    } catch (error) {
      logger.error('Logout error', error, 'AuthProvider');
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
        profilePictureUrl: profile.profilePictureUrl || (user as ExtendedUser).profilePictureUrl
      } as ExtendedUser;
      
      setUser(updatedUser);
    } catch (error) {
      logger.error('Update profile error', error, 'AuthProvider');
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