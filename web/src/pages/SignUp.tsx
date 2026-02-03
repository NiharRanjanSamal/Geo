import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '@/api/auth';

export function SignUp() {
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantCode: '',
    companyName: '',
    companyCode: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.tenantName.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.tenantCode.trim()) {
      setError('Organization code is required');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.tenantCode)) {
      setError('Organization code can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.companyCode.trim()) {
      setError('Company code is required');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.companyCode)) {
      setError('Company code can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.adminEmail.trim()) {
      setError('Admin email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.adminPassword) {
      setError('Password is required');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setError('');
    setLoading(true);
    try {
      await signup({
        tenant_name: formData.tenantName,
        tenant_code: formData.tenantCode,
        company_name: formData.companyName,
        company_code: formData.companyCode,
        admin_email: formData.adminEmail,
        admin_password: formData.adminPassword,
      });
      
      // Show success message and redirect to login
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
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

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white text-emerald-600 items-center justify-center text-2xl font-display font-bold mb-4 shadow-2xl shadow-black/20">
            G
          </div>
          <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">
            Create Your Organization
          </h1>
          <p className="text-white/90 mt-2 drop-shadow">Get started with GeoAttend in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    step === num
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : step > num
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step > num ? '✓' : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded transition-all ${
                      step > num ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Organization Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-slate-900">
                    Organization Details
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Set up your organization's basic information
                  </p>
                </div>

                <div>
                  <label htmlFor="tenantName" className="block text-sm font-semibold text-slate-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tenantName"
                    type="text"
                    value={formData.tenantName}
                    onChange={(e) => handleChange('tenantName', e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This is your organization's display name
                  </p>
                </div>

                <div>
                  <label htmlFor="tenantCode" className="block text-sm font-semibold text-slate-700 mb-2">
                    Organization Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tenantCode"
                    type="text"
                    value={formData.tenantCode}
                    onChange={(e) => handleChange('tenantCode', e.target.value.toLowerCase())}
                    placeholder="e.g., acme-corp"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono transition-shadow"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Unique identifier (letters, numbers, hyphens, underscores only)
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Company Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-slate-900">
                    Company Details
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Add your first company under this organization
                  </p>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="e.g., Acme Inc."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="companyCode" className="block text-sm font-semibold text-slate-700 mb-2">
                    Company Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyCode"
                    type="text"
                    value={formData.companyCode}
                    onChange={(e) => handleChange('companyCode', e.target.value.toLowerCase())}
                    placeholder="e.g., acme-inc"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono transition-shadow"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Unique identifier for this company
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Admin Account */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-slate-900">
                    Admin Account
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Create your administrator account
                  </p>
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminPassword}
                      onChange={(e) => handleChange('adminPassword', e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 focus:outline-none rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    At least 6 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 focus:outline-none rounded"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
                >
                  Back
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors text-center"
                >
                  Back to Login
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-lg shadow-emerald-200"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-sm mt-6 drop-shadow">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-bold hover:text-white/80 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
