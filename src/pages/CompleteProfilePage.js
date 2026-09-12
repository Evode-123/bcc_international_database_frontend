import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import { AuthCard } from '../components/AuthCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/Banners';
 
export function CompleteProfilePage() {
  const { patchUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.completeProfile(fullName.trim(), phoneNumber.trim() || undefined);
      patchUser({ profileCompleted: true, fullName: fullName.trim() });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard title="Complete your profile" subtitle="Just a couple more details before you get started.">
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Esther Mukiza"
          required
          autoFocus
        />
        <TextInput
          label="Phone number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Optional"
        />
        <div className="mt-2">
          <Button isLoading={isLoading}>Continue</Button>
        </div>
      </form>
    </AuthCard>
  );
}
