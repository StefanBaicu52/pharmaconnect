import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-20 h-20 mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">PharmaConnect</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@pharmaconnect.ro" type="email"
              className="rounded-xl" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <Input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" type="password"
              className="rounded-xl" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <Button onClick={handleSubmit} disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 text-lg mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="mb-2">Demo accounts:</p>
          <button onClick={() => { setEmail('admin@pharmaconnect.ro'); setPassword('admin123'); }}
            className="text-green-600 hover:underline mr-4">Admin login</button>
          <button onClick={() => { setEmail('user@pharmaconnect.ro'); setPassword('user123'); }}
            className="text-blue-600 hover:underline">User login</button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">Forgot password?</Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-600 hover:underline font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
}
