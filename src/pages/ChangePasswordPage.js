import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import { AuthCard } from '../components/AuthCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
 
export function ChangePasswordPage() {
  const { user, patchUser } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Distinguishes "you must do this before continuing" from "you chose to
  // do this from your account settings" -- same form either way, since
  // the backend endpoint is identical, but the framing differs.
  const isForced = user?.mustChangePassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      await authApi.changePassword(newPassword);
      patchUser({ mustChangePassword: false });

      if (isForced) {
        navigate(user.profileCompleted ? '/dashboard' : '/complete-profile', { replace: true });
      } else {
        setSuccess('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title={isForced ? 'Set a new password' : 'Change your password'}
      subtitle={
        isForced
          ? 'For your security, please set a permanent password before continuing.'
          : 'Choose a new password for your account.'
      }
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
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
          <Button isLoading={isLoading}>Save password</Button>
        </div>
      </form>
    </AuthCard>
  );
}
