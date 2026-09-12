import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { AuthCard } from '../components/AuthCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/Banners';
 
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset successfully. Please sign in.' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'This reset link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  }

  // No token in the URL at all -- someone navigated here directly rather
  // than through the emailed link. Nothing to submit in that case.
  if (!token) {
    return (
      <AuthCard title="Invalid reset link">
        <ErrorBanner message="This page must be opened from the link in your password reset email." />
        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-brand hover:underline">
            Request a new reset link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Enter a new password for your account.">
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <TextInput
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          autoFocus
        />
        <TextInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
          required
        />
        <div className="mt-2">
          <Button isLoading={isLoading}>Reset password</Button>
        </div>
      </form>
    </AuthCard>
  );
}
