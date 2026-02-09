import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Users, Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'helen.carter@rcha.org.uk', role: 'Chief Operating Officer', persona: 'coo' },
  { email: 'james.wright@rcha.org.uk', role: 'Head of Housing', persona: 'head-of-housing' },
  { email: 'priya.patel@rcha.org.uk', role: 'Team Manager', persona: 'manager' },
  { email: 'sarah.mitchell@rcha.org.uk', role: 'Housing Officer', persona: 'housing-officer' },
  { email: 'mark.johnson@rcha.org.uk', role: 'Operative', persona: 'operative' },
];

export default function LoginPage() {
  const { login, error, setDemoMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/briefing');
    } catch {
      // error is set in context
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (persona: string) => {
    localStorage.setItem('socialhomes-persona', persona);
    setDemoMode(true);
    navigate('/briefing');
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">SocialHomes<span className="text-emerald-400">.Ai</span></h1>
              <p className="text-xs text-gray-500">by Yantra.Works</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">AI-Native Social Housing Management</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-400" />
            Sign In
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D1117] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="name@organisation.org.uk"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D1117] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors pr-12"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Demo Mode Toggle */}
          <button
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="w-full py-2.5 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            {showDemoAccounts ? 'Hide Demo Accounts' : 'Continue with Demo Account'}
          </button>

          {/* Demo Accounts List */}
          {showDemoAccounts && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 mb-3">Select a persona to explore the system:</p>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.persona}
                  onClick={() => handleDemoLogin(account.persona)}
                  className="w-full px-4 py-3 bg-[#0D1117] hover:bg-[#1C2333] border border-gray-800 hover:border-emerald-500/30 rounded-lg transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                        {account.role}
                      </p>
                      <p className="text-xs text-gray-500">{account.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-md">
                      {account.persona}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          BETA &middot; Built by Yantra.Works &middot; HACT v3.5 Compliant
        </p>
      </div>
    </div>
  );
}
