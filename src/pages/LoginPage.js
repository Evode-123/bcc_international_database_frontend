import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/Banners';
import { consumeSessionEndedMessage } from '../api/client';
 
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Read (and clear) the stored session-ended message once, on mount, via
  // useState's lazy initializer. This is what was previously read from
  // `location.state?.sessionEndedReason` -- but nothing was ever setting
  // that router state, so the banner never showed. ProtectedRoute's idle
  // handler and api/client.js's 401 interceptor both now write to
  // sessionStorage via the same helper, and this reads it back out.
  const [sessionNotice, setSessionNotice] = useState(() => consumeSessionEndedMessage());

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else if (!loggedInUser.profileCompleted) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        setError(err.response?.data?.error || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* ── Left side — full-bleed background illustration, hidden below lg ── */}
      <div
        className="relative hidden lg:flex flex-[1.05] items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/login_background.png')" }}
      >
        {/* Blue tint so the illustration reads with the same deep-navy mood
            as the reference, while still showing the image underneath */}
        <div className="absolute inset-0 bg-[#0A2E6E] mix-blend-multiply opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2E6E]/20 via-transparent to-[#0A2E6E]/50" />

        <div className="relative z-10 w-[85%] max-w-xl px-6 text-center text-white">
          <h1
            className="text-4xl font-extrabold italic leading-[1.15] tracking-tight xl:text-5xl"
            style={{ textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}
          >
            Bible Communication
            <br />
            Center
          </h1>
          <p
            className="mt-8 text-lg italic leading-relaxed text-white/95 xl:text-xl"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            Raising consecrated and life-giving disciples to make Jesus the Lord of our generation.
          </p>
        </div>
      </div>

      {/* ── Right side — the form ── */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 lg:rounded-l-[60px] lg:shadow-[-28px_0_70px_rgba(10,46,110,0.45)]"
      >
        <div className="w-full max-w-sm">
          {/* Logo + eyebrow */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-white p-1 shadow-lg ring-4 ring-slate-100">
              <img
                src="/bcc_logo.png"
                alt="Bible Communication Center"
                className="h-full w-full rounded-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML =
                    '<div class="flex h-full w-full items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-white">BCC</div>';
                }}
              />
            </div>
            <p className="text-base font-semibold uppercase tracking-widest text-slate-400">
              Sign in to your account
            </p>
          </div>

          {sessionNotice && (
            <div className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>{sessionNotice.message}</span>
              <button
                type="button"
                onClick={() => setSessionNotice(null)}
                className="flex-shrink-0 text-lg leading-none text-amber-400 hover:text-amber-600"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="ml-0.5 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/60 px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="ml-0.5 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/60 px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </div>

            <div className="-mt-1 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-[18px] w-[18px] cursor-pointer accent-brand"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-red-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-red-600 py-3 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_4px_10px_rgba(220,38,38,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_8px_20px_rgba(220,38,38,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Please wait…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}