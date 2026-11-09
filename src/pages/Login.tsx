import { useState } from 'react';
import { Lock, Mail, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { hexToRgba } from '../utils';
import logo from '../assets/logo.png';

export const Login = () => {
  const { login, isLoading, primaryColor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleRevealPassword = () => setShowPassword((prev) => !prev);
  const lastLogo = localStorage.getItem('lastUploadedLogo');

  return (
    <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.05)}, transparent, ${hexToRgba(primaryColor, 0.05)})` }} className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center -mb-8">
          {lastLogo ? (
            <img src={lastLogo} className="w-24 h-24 object-cover mx-auto rounded-2xl shadow-xs" alt="Store logo" />
          ) : (
            <img src={logo} className="w-24 h-24 object-cover mx-auto rounded-2xl shadow-md border border-slate-700/20" alt="DineFlow Till logo" />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent"
                  required
                />
                {showPassword ? (<EyeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 select-none cursor-pointer hover:text-gray-500"
                  onClick={handleRevealPassword} />) : (
                  <EyeOffIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 select-none cursor-pointer hover:text-gray-500"
                    onClick={handleRevealPassword} />
                )}

              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
