import { useState } from 'react';
import { Lock, Mail, EyeIcon, EyeOffIcon, Hash } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { hexToRgba } from '../utils';
import logo from '../assets/auvren-logo.png';

export const Login = () => {
  const { login, loginWithPin, isLoading, primaryColor } = useAuth();
  // A till remembers its company after the first email sign-in, so staff can then use employee number + PIN.
  const device = (() => { try { return JSON.parse(localStorage.getItem('till.device') ?? 'null') as { tenantId: string; storeName?: string } | null; } catch { return null; } })();
  const [mode, setMode] = useState<'email' | 'pin'>(device ? 'pin' : 'email');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [pin, setPin] = useState('');
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

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (device && employeeNumber && pin.length >= 4) { try { sessionStorage.setItem('till.clockInOnLogin', '1'); } catch { /* ignore */ } await loginWithPin(device.tenantId, employeeNumber, pin); }
  };

  const handleRevealPassword = () => setShowPassword((prev) => !prev);
  const lastLogo = localStorage.getItem('lastUploadedLogo');

  return (
    <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.05)}, transparent, ${hexToRgba(primaryColor, 0.05)})` }} className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          {lastLogo ? (
            <img src={lastLogo} className="w-24 h-24 object-cover mx-auto rounded-2xl shadow-xs" alt="Store logo" />
          ) : (
            <img src={logo} className="w-80 max-w-full h-auto mx-auto rounded-2xl bg-white shadow-md" alt="Auvren – Till & Ecommerce Solutions" />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In</h2>
          <div className="grid grid-cols-2 gap-2 mb-5" role="tablist">
            {(['pin', 'email'] as const).map(m => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`py-2 rounded-lg border text-sm font-semibold ${mode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                {m === 'pin' ? 'Staff PIN' : 'Email'}
              </button>
            ))}
          </div>

          {mode === 'pin' && (
            device ? (
              <form onSubmit={handlePin} className="space-y-4">
                {device.storeName && <p className="text-sm text-gray-600">{device.storeName}</p>}
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input inputMode="numeric" autoFocus autoComplete="off" value={employeeNumber} aria-label="Employee number" placeholder="Employee number"
                    onChange={(e) => setEmployeeNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" inputMode="numeric" autoComplete="off" value={pin} aria-label="PIN" placeholder="PIN"
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" />
                </div>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full" disabled={!employeeNumber || pin.length < 4}>Sign in</Button>
              </form>
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">Sign in once with your email on this till to set it up. After that, staff can sign in with their employee number and PIN.</p>
            )
          )}

          {mode === 'email' && <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>}
        </div>
      </div>
    </div>
  );
};
