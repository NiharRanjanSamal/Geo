import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/api/client';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        {/* Vibrant gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600" />

        {/* Animated geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 2px, transparent 2px),
              radial-gradient(circle at 60% 30%, rgba(255,255,255,0.2) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 2px, transparent 2px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 80px 80px, 120px 120px, 90px 90px',
            backgroundPosition: '0 0, 40px 40px, 80px 20px, 20px 60px',
          }}
        />

        {/* Decorative diagonal lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.5) 50px,
                rgba(255,255,255,0.5) 52px
              )`
            }}
          />
        </div>

        {/* Decorative floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-4 border-white/10" />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full border-2 border-white/5" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-3xl border-4 border-white/10 rotate-45" />
          <div className="absolute top-1/4 -right-20 w-64 h-64 rounded-full border-2 border-white/8" />
          <div className="absolute top-20 left-20 w-20 h-20 rounded-lg bg-white/5 rotate-12" />
          <div className="absolute bottom-32 right-40 w-16 h-16 rounded-full bg-white/5" />
        </div>

        {/* Light overlay to soften the background */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-white text-emerald-600 items-center justify-center text-2xl font-display font-bold mb-4 shadow-2xl shadow-black/20">
              G
            </div>
            <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">Check your email</h1>
            <p className="text-white/90 mt-2 drop-shadow">If an account exists for that email, we&apos;ve sent you a link to reset your password. The link is valid for 30 minutes.</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <p className="text-slate-600 mb-6">
              Didn&apos;t get the email? Check spam or{' '}
              <button
                type="button"
                onClick={() => { setSuccess(false); setEmail(''); }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                try again
              </button>
              .
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Vibrant gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600" />

      {/* Animated geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 2px, transparent 2px),
            radial-gradient(circle at 60% 30%, rgba(255,255,255,0.2) 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 2px, transparent 2px),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 80px 80px, 120px 120px, 90px 90px',
          backgroundPosition: '0 0, 40px 40px, 80px 20px, 20px 60px',
        }}
      />

      {/* Decorative diagonal lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 50px,
              rgba(255,255,255,0.5) 50px,
              rgba(255,255,255,0.5) 52px
            )`
          }}
        />
      </div>

      {/* Decorative floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-4 border-white/10" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full border-2 border-white/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-3xl border-4 border-white/10 rotate-45" />
        <div className="absolute top-1/4 -right-20 w-64 h-64 rounded-full border-2 border-white/8" />
        <div className="absolute top-20 left-20 w-20 h-20 rounded-lg bg-white/5 rotate-12" />
        <div className="absolute bottom-32 right-40 w-16 h-16 rounded-full bg-white/5" />
      </div>

      {/* Light overlay to soften the background */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white text-emerald-600 items-center justify-center text-2xl font-display font-bold mb-4 shadow-2xl shadow-black/20">
            G
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">Forgot password?</h1>
          <p className="text-white/90 mt-2 drop-shadow">Enter your email and we&apos;ll send you a link to reset your password.</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                placeholder="you@company.com"
              />
            </div>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending link...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="text-center mt-6">
            <Link to="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
