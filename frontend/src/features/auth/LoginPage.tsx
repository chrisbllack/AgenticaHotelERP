import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">INFINEON</h1>
          <p className="text-gray-500 mt-1">Enterprise Hotel PMS</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="admin@infineon.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600 mb-1">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-left max-w-md mx-auto">
              <span className="text-gray-400">Admin</span><code className="text-gray-600">admin@infineon.com</code><code className="text-blue-500 font-medium">admin123</code>
              <span className="text-gray-400">GM</span><code className="text-gray-600">gm@infineon.com</code><code className="text-blue-500 font-medium">manager123</code>
              <span className="text-gray-400">Receptionist</span><code className="text-gray-600">receptionist@infineon.com</code><code className="text-blue-500 font-medium">reception123</code>
              <span className="text-gray-400">Cashier</span><code className="text-gray-600">cashier@infineon.com</code><code className="text-blue-500 font-medium">cashier123</code>
              <span className="text-gray-400">Housekeeping</span><code className="text-gray-600">housekeeping@infineon.com</code><code className="text-blue-500 font-medium">housekeep123</code>
              <span className="text-gray-400">Kitchen Mgr</span><code className="text-gray-600">kitchen@infineon.com</code><code className="text-blue-500 font-medium">kitchen123</code>
              <span className="text-gray-400">Accountant</span><code className="text-gray-600">accountant@infineon.com</code><code className="text-blue-500 font-medium">account123</code>
              <span className="text-gray-400">HR Manager</span><code className="text-gray-600">hr@infineon.com</code><code className="text-blue-500 font-medium">hr123</code>
              <span className="text-gray-400">Waiter</span><code className="text-gray-600">waiter@infineon.com</code><code className="text-blue-500 font-medium">waiter123</code>
            </div>
          </div>
        </form>

        <div className="text-center mt-4">
          <a href="/tour" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200">
            <span>🚀</span>
            <span>Explore All Features</span>
            <span>→</span>
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          INFINEON Enterprise Platform v1.0.0 — On-Premises Deployment
        </p>
      </div>
    </div>
  );
}
