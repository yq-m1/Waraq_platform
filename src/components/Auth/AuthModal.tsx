import { useState, useEffect, type FormEvent } from 'react';
import { X, Eye, EyeOff, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot' | 'set-password';

type AuthModalProps = {
  isOpen: boolean;
  initialMode: 'login' | 'signup' | 'set-password';
  onClose: () => void;
};

export default function AuthModal({ isOpen, initialMode, onClose }: AuthModalProps) {
  const { t, lang } = useLang();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccess('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  if (!isOpen) return null;

  function mapAuthError(error: { message: string; code?: string }, t: typeof import('../../translations/ar').ar): string {
    const code = error.code ?? '';
    const msg = error.message.toLowerCase();

    if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already exists')) {
      return t.auth.error_user_exists;
    }
    if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return t.auth.error_invalid_credentials;
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      return t.auth.error_email_not_confirmed;
    }
    if (code === 'weak_password' || msg.includes('weak password') || msg.includes('password should')) {
      return t.auth.error_weak_password;
    }
    if (code === 'over_request_rate_limit' || code === 'too_many_requests' || msg.includes('rate limit') || msg.includes('too many')) {
      return t.auth.error_too_many_requests;
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
      return t.auth.error_network;
    }
    return t.auth.error_unknown;
  }

  function isPasswordStrong(pw: string): boolean {
    return /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && pw.length >= 8;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(mapAuthError(error, t));
    } else {
      await refreshProfile(data.user?.id);
      onClose();
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t.auth.passwords_dont_match);
      setLoading(false);
      return;
    }

    if (!isPasswordStrong(password)) {
      setError(t.auth.password_weak);
      setLoading(false);
      return;
    }

    if (username.length < 3 || !/^[a-zA-Z0-9_\u0600-\u06FF]+$/.test(username)) {
      setError(t.auth.username_hint);
      setLoading(false);
      return;
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      setError(t.auth.username_taken);
      setLoading(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupError) {
      setError(mapAuthError(signupError, t));
      setLoading(false);
      return;
    }

    if (data.user) {
      // The DB trigger already created the profile via auth.users INSERT.
      // Upsert ensures the chosen username wins even if the trigger ran first
      // with a fallback value.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, username }, { onConflict: 'id' });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Email confirmation is disabled — user is immediately logged in.
        await refreshProfile(data.user.id);
      }
    }

    setLoading(false);
    // Always show the email confirmation message since confirmation is enabled.
    setSuccess(t.auth.signup_confirm_email);
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(t.auth.reset_sent);
    }
  }

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t.auth.passwords_dont_match);
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(t.auth.password_updated);
      setTimeout(() => onClose(), 2200);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-stone-50 rounded-2xl shadow-2xl overflow-hidden"
        dir={t.dir}
      >
        {/* Decorative header strip */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-800">
                  {mode === 'login' ? t.auth.login
                    : mode === 'signup' ? t.auth.signup
                    : mode === 'set-password' ? t.auth.set_new_password
                    : t.auth.reset_password}
                </h2>
                <p className="text-stone-400 text-xs mt-0.5">
                  {lang === 'ar' ? 'وَرَق — منصة الكتب' : 'Waraq — Book Platform'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && !success && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth.email_placeholder}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.auth.password_placeholder}
                    required
                    className={`w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white ${lang === 'ar' ? 'pl-10' : 'pr-10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors ${lang === 'ar' ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className={`mt-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors ${lang === 'ar' ? 'text-right w-full' : 'text-left'}`}
                >
                  {t.auth.forgot_password}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-amber-500/20 mt-2"
              >
                {loading ? '...' : t.auth.login}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && !success && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.username}</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t.auth.username_hint}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth.email_placeholder}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.auth.password_placeholder}
                    required
                    className={`w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white ${lang === 'ar' ? 'pl-10' : 'pr-10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors ${lang === 'ar' ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-stone-400" dir="rtl">{t.auth.password_requirements}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.confirm_password}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.confirm_password}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-amber-500/20 mt-2"
              >
                {loading ? '...' : t.auth.signup}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && !success && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-stone-500 mb-2">
                {lang === 'ar'
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.'
                  : "Enter your email and we'll send you a reset link."}
              </p>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth.email_placeholder}
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-amber-500/20"
              >
                {loading ? '...' : t.auth.reset_password}
              </button>
            </form>
          )}

          {/* Set New Password Form (password recovery flow) */}
          {mode === 'set-password' && !success && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <p className="text-sm text-stone-500 mb-2">
                {lang === 'ar'
                  ? 'أدخل كلمة المرور الجديدة لحسابك.'
                  : 'Enter a new password for your account.'}
              </p>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.new_password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.auth.password_placeholder}
                    required
                    minLength={8}
                    className={`w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white ${lang === 'ar' ? 'pl-10' : 'pr-10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors ${lang === 'ar' ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.auth.confirm_password}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t.auth.confirm_password}
                  required
                  minLength={8}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-amber-500/20"
              >
                {loading ? '...' : t.auth.set_new_password}
              </button>
            </form>
          )}

          {/* Footer links */}
          {!success && mode !== 'set-password' && (
            <div className="mt-6 text-center text-sm text-stone-500">
              {mode === 'login' ? (
                <>
                  {t.auth.no_account}{' '}
                  <button onClick={() => setMode('signup')} className="text-amber-600 font-semibold hover:text-amber-700">
                    {t.auth.signup}
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  {t.auth.have_account}{' '}
                  <button onClick={() => setMode('login')} className="text-amber-600 font-semibold hover:text-amber-700">
                    {t.auth.login}
                  </button>
                </>
              ) : (
                <button onClick={() => setMode('login')} className="text-amber-600 font-semibold hover:text-amber-700">
                  {t.auth.back_to_login}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
