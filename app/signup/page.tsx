'use client';

import { Suspense } from 'react';
import SignUpForm from './SignUpForm';

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
