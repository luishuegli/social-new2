'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActionCenterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Connection Hub
    router.replace('/compass');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-content-secondary">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting to Connection Hub...</h2>
        <p>You're being redirected to the new Connection Hub.</p>
      </div>
    </div>
  );
}