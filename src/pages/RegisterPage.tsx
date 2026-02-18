import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-800 px-6 sm:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50">
        <div className="flex items-center gap-4 text-[#111814] dark:text-white">
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">security</span>
          </div>
          <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Secure Steganography Chat</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Already have an account?</span>
          <button
            onClick={onSwitchToLogin}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] text-sm font-bold transition-all duration-200"
          >
            <span className="truncate">Log in</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[520px] bg-white dark:bg-[#1a2e23] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="pt-10 pb-2 text-center px-8">
            <h1 className="text-[#111814] dark:text-white tracking-tight text-[32px] font-bold leading-tight">Create Your Account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal pt-2">Join the secure communication network.</p>
          </div>

          {error && (
            <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[#111814] dark:text-white text-sm font-semibold">Username</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1a12] text-[#111814] dark:text-white h-12 px-4 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                  placeholder="johndoe88"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-primary text-xl">check_circle</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111814] dark:text-white text-sm font-semibold">Email Address</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1a12] text-[#111814] dark:text-white h-12 px-4 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111814] dark:text-white text-sm font-semibold">Password</label>
              <div className="relative flex items-center">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1a12] text-[#111814] dark:text-white h-12 px-4 pr-20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111814] dark:text-white text-sm font-semibold">Confirm Password</label>
              <div className="relative flex items-center">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1a12] text-[#111814] dark:text-white h-12 px-4 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-black text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="bg-background-light dark:bg-[#122218] p-6 text-center border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise-Grade Steganography</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 px-4 leading-relaxed">
              Using LSB matching and advanced pixel distribution, your messages remain invisible to forensic analysis.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-400 dark:text-gray-600 text-sm mt-auto">
        <p>© 2024 Secure Steganography Chat System. All rights reserved.</p>
      </footer>
    </div>
  );
}
