import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import { AuthCard } from '../components/AuthCard';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // The backend always returns this same generic message, whether or
      // not the email matches a real account -- this is deliberate, so
      // the UI shouldn't (and can't) tell the difference either.
      const { message } = await authApi.forgotPassword(email);
      setSuccess(message);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {!success && (
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          <div className="mt-2">
            <Button isLoading={isLoading}>Send reset link</Button>
          </div>
        </form>
      )}
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
