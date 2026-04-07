import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Wraps protected pages (Dashboard, CourseView, etc.).
 * Lets admins/instructors through always.
 * For regular users, checks that they have an accepted Application.
 * If not, shows a "pending approval" screen.
 */
export default function AccessGate({ children, user }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'approved' | 'pending'

  useEffect(() => {
    if (!user) return;

    // Admins and instructors always get through
    if (user.role === 'admin' || user.user_type === 'admin' || user.user_type === 'instructor') {
      setStatus('approved');
      return;
    }

    // Check for an accepted application matching this user's email
    base44.entities.Application.filter({ email: user.email, status: 'accepted' })
      .then((results) => {
        setStatus(results.length > 0 ? 'approved' : 'pending');
      })
      .catch(() => setStatus('pending'));
  }, [user]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-amber-100">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Application Pending</h1>
          <p className="text-slate-600 mb-6">
            Your account is awaiting approval. Once your application is accepted by our admissions team, you'll have full access to your learning area.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span>
          </p>
          <button
            onClick={() => base44.auth.logout('/')}
            className="text-sm text-slate-500 underline hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return children;
}