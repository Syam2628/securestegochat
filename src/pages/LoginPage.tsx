import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col transition-colors duration-300">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#dbe6e0] dark:border-[#1e3a2b] bg-white dark:bg-[#102218] px-6 md:px-10 py-3">
        <div className="flex items-center gap-3 text-[#111814] dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white shadow-sm">
            <span className="material-symbols-outlined text-xl">shield_lock</span>
          </div>
          <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Secure Steganography Chat</h2>
        </div>
        <div className="flex flex-1 justify-end gap-4 md:gap-8">
          <button
            onClick={onSwitchToRegister}
            className="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-[#111814] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
          >
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background-light to-[#e8f5ed] dark:from-background-dark dark:to-[#0a1a12]">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <div className="mb-8 text-center">
            <h1 className="text-[#111814] dark:text-white tracking-light text-[32px] font-bold leading-tight pb-2">Welcome Back</h1>
            <p className="text-[#4a6b57] dark:text-gray-400 text-base font-normal leading-normal">
              Research Project: Covert Channel Communication
            </p>
          </div>

          <div className="w-full bg-white dark:bg-[#162d20] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8 border border-[#dbe6e0] dark:border-[#1e3a2b]">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">visibility_off</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#111814] dark:text-gray-200 text-sm font-semibold leading-normal pb-2">Username</p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#618972] text-xl">person</span>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111814] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-[#dbe6e0] dark:border-[#2a4d3a] bg-white dark:bg-[#0d1a12] focus:border-primary h-14 placeholder:text-[#618972] pl-12 pr-4 text-base font-normal leading-normal transition-all"
                      placeholder="Enter your alias"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col w-full">
                  <p className="text-[#111814] dark:text-gray-200 text-sm font-semibold leading-normal pb-2">Password</p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#618972] text-xl">lock</span>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111814] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-[#dbe6e0] dark:border-[#2a4d3a] bg-white dark:bg-[#0d1a12] focus:border-primary h-14 placeholder:text-[#618972] pl-12 pr-4 text-base font-normal leading-normal transition-all"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="flex items-start gap-3 p-4 bg-background-light dark:bg-[#0d1a12] rounded-lg border border-[#dbe6e0] dark:border-[#1e3a2b]">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <p className="text-[#4a6b57] dark:text-gray-400 text-xs leading-relaxed">
                  Messages are concealed using LSB (Least Significant Bit) steganography within cover images. All traffic is AES-256 encrypted.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-[#111814] text-base font-bold leading-normal hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin-slow mr-3">progress_activity</span>
                      <span className="truncate">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">Join Chat</span>
                      <span className="material-symbols-outlined ml-2 text-xl">login</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 py-2 px-4 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
              <span className="material-symbols-outlined text-red-500 text-lg">verified_user</span>
              <p className="text-[10px] md:text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                All images are automatically scanned for hidden threats
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#f0f4f2] dark:border-[#1e3a2b] flex justify-between items-center text-xs text-[#618972]">
              <a onClick={onSwitchToRegister} className="hover:text-primary transition-colors font-medium cursor-pointer">Don't have an account?</a>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(17,212,98,0.5)]"></span>
                <span className="font-medium">System Online</span>
              </div>
            </div>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-[#618972] dark:text-gray-500 text-sm">
              © 2024 Stegano Project • Secure Covert Channels
            </p>
          </footer>
        </div>
      </main>

      <div className="fixed bottom-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
        <span className="material-symbols-outlined text-[200px]">fingerprint</span>
      </div>
      <div className="fixed top-20 left-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
        <span className="material-symbols-outlined text-[150px]">hub</span>
      </div>
    </div>
  );
}
