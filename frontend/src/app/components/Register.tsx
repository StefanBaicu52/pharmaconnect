import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';
import { API_BASE } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.username || !form.password) { setError('All fields are required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, username: form.username, password: form.password }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      navigate('/login');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-20 h-20 mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
        </div>
        <div className="space-y-4">
          {(['email','username','password','confirm'] as const).map(key => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">{key === 'confirm' ? 'Confirm Password' : key}</label>
              <Input type={key.includes('password') || key === 'confirm' ? 'password' : key === 'email' ? 'email' : 'text'}
                value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="rounded-xl" />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 text-lg">
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
