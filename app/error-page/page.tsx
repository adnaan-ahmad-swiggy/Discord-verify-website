'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
  oauth_error: 'Discord authentication failed. Please try again.',
  session_expired: 'Your session has expired. Please start over.',
  invalid_otp: 'Invalid OTP. Please check and try again.',
  otp_expired: 'OTP has expired. Please request a new one.',
  rate_limited: 'Too many attempts. Please wait before trying again.',
  role_error: 'Verification succeeded but role assignment failed. Please contact an admin.',
  server_error: 'Something went wrong. Please try again later.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'server_error';
  const message = errorMessages[type] || errorMessages.server_error;

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="text-6xl">❌</div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Something Went Wrong
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
      <a
        href="/api/auth/discord"
        className="inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
      >
        Try Again
      </a>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
