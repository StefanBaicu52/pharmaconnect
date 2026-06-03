/**
 * Assignment 4 Silver: Password recovery UI
 * Two-step flow: request code by email → reset with code
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';
import { API_BASE } from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      setMessage(`Reset code sent! (Demo: ${data.resetCode})`);
      setStep('reset');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!resetCode || !newPassword) { setError('All fields are required.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode, newPassword }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      navigate('/login', { state: { message: 'Password reset successfully. Please login.' } });
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Reset failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Password Recovery</h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          {step === 'request' ? 'Enter your email to receive a reset code.' : 'Enter the code and your new password.'}
        </p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={requestCode} disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
              <Input
                type="text"
                placeholder="6-digit code"
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                className="rounded-xl"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button onClick={resetPassword} disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <button
              onClick={() => { setStep('request'); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-1"
            >
              ← Try different email
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
