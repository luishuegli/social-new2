'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import AppLayout from './AppLayout';
import { db } from '../Lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthWrapper() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      if (!mounted) return;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        router.replace(snap.exists() ? '/home' : '/onboarding');
      } catch {
        router.replace('/home');
      }
    })();
  }, [mounted, user, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-background-primary" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 min-w-[320px]">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <AppLayout><div className="p-4 sm:p-6 lg:p-8 min-w-0">Redirecting...</div></AppLayout>;
  }

  return (
    <div className="min-h-screen bg-gray-50 min-w-[320px] overflow-x-auto">
      {isLogin ? (
        <div className="min-w-0">
          <LoginForm />
          <div className="text-center pb-4 sm:pb-6 lg:pb-8 px-4">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <SignupForm />
          <div className="text-center pb-4 sm:pb-6 lg:pb-8 px-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}