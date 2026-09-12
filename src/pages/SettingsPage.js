import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
import { useAuth } from '../context/AuthContext';
import { setSessionEndedMessage } from '../api/client';
import * as authApi from '../api/auth';

const TABS = [
  { id: 'profile', label: 'My profile' },
  { id: 'email', label: 'Change email' },
  { id: 'password', label: 'Change password' },
];
 
// Same visual language as the role badges on the Manage Users page, kept
// local here since Settings never needs the full ManageUsersPage import.
const ROLE_STYLES = {
  super_admin: 'bg-red-50 text-red-700 border-red-100',
  admin: 'bg-gray-100 text-gray-700 border-gray-200',
};
const DEFAULT_ROLE_STYLE = 'bg-brand-pale text-brand border-brand/15';

function RoleBadge({ role }) {
  if (!role) return null;
  const style = ROLE_STYLES[role] || DEFAULT_ROLE_STYLE;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${style}`}
    >
      {role.replace(/_/g, ' ')}
    </span>
  );
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Profile header card — avatar, name, role, member-since ─────────────────

function ProfileHeaderCard({ user }) {
  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = formatDate(user?.createdAt);

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
      style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
    >
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0 mx-auto sm:mx-0"
        style={{ background: 'linear-gradient(135deg, #1E7FD8, #0A2E6E)' }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h2 className="text-lg font-bold text-gray-900 truncate">
          {user?.fullName || 'Unnamed user'}
        </h2>
        <p className="text-sm text-gray-400 truncate">{user?.email}</p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
          <RoleBadge role={user?.role} />
          {memberSince && (
            <span className="text-xs text-gray-400">Member since {memberSince}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab pills — horizontally scrollable so they never overflow on mobile ───

function TabButton({ tab, activeTab, onClick }) {
  const isActive = tab.id === activeTab;
  return (
    <button
      type="button"
      onClick={() => onClick(tab.id)}
      className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
        isActive
          ? 'bg-brand text-white shadow-sm'
          : 'text-gray-500 hover:bg-brand-pale hover:text-brand'
      }`}
    >
      {tab.label}
    </button>
  );
}

// ── Read-only info tile, used for the account-details section ──────────────

function InfoField({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 truncate">
        {value || '—'}
      </p>
    </div>
  );
}

// ── My profile tab ──────────────────────────────────────────────────────────

function MyProfileTab() {
  const { user, patchUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const memberSince = formatDate(user?.createdAt) || '—';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    setIsLoading(true);
    try {
      // Reuses the same endpoint the forced first-login flow uses -- it's
      // a plain "set fullName/phoneNumber" update either way, and
      // re-marking profileCompleted:true here is harmless since it's
      // already true for anyone reaching Settings normally.
      await authApi.completeProfile(fullName.trim(), phoneNumber.trim() || undefined);
      patchUser({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || undefined });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <ErrorBanner message={error} onClose={() => setError('')} />
      <SuccessBanner message={success} onClose={() => setSuccess('')} />

      {/* ── Editable fields ── */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Editable details
      </p>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <TextInput
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Esther Mukiza"
            required
          />
          <TextInput
            label="Phone number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="mt-1 w-full sm:w-48">
          <Button isLoading={isLoading}>Save changes</Button>
        </div>
      </form>

      {/* ── Read-only account info ── */}
      <div className="border-t border-gray-100 mt-7 pt-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Account information
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Email is changed from the "Change email" tab. Role and account status are
          managed by an administrator.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Email" value={user?.email} />
          <InfoField label="Role" value={user?.role?.replace(/_/g, ' ')} />
          <InfoField label="Member since" value={memberSince} />
          <InfoField
            label="Account status"
            value={user?.mustChangePassword ? 'Pending setup' : 'Active'}
          />
        </div>
      </div>
    </div>
  );
}

// ── Change email tab ─────────────────────────────────────────────────────────
//
// Treated as a sensitive, security-relevant action, not a plain field edit:
//  - requires the CURRENT password to be re-typed (the backend verifies it;
//    this form can't be used just because a session happens to be active)
//  - on success, forces a full logout + redirect to /login with a clear
//    explanation, via the same setSessionEndedMessage/consumeSessionEndedMessage
//    plumbing used for idle-timeout and token-expiry sign-outs -- so the
//    banner on the login page "just works" with no changes needed there.

function ChangeEmailTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setError('Please enter your new email address.');
      return;
    }
    if (trimmedEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setError('That is already your current email address.');
      return;
    }
    if (!currentPassword) {
      setError('Please enter your current password to confirm this change.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changeEmail(trimmedEmail, currentPassword);

      // Success -- the backend has already updated the email and emailed
      // a security notice to the OLD address. The token in sessionStorage
      // is now tied to a stale email, so force a clean re-login rather
      // than silently continuing: this also lets the user immediately
      // confirm the new address actually works.
      setSessionEndedMessage(
        'email_changed',
        'Your email address was changed successfully. Please log in again using your new email.'
      );
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update your email. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-gray-500 mb-1">
        Current email:{' '}
        <span className="font-semibold text-gray-700 break-all">{user?.email}</span>
      </p>
      <p className="text-sm text-gray-500 mb-5">
        For your security, confirm your current password to change your email address.
        You'll be signed out and asked to log in again using the new address.
      </p>
      <ErrorBanner message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <TextInput
            label="New email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          <TextInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            required
          />
        </div>
        <div className="mt-1 w-full sm:w-60">
          <Button isLoading={isLoading}>Update email &amp; log out</Button>
        </div>
      </form>
    </div>
  );
}

// ── Change password tab ─────────────────────────────────────────────────────

function ChangePasswordTab() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      setSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-gray-500 mb-5">
        Choose a new password for your account. You'll keep using your current password
        until you save this.
      </p>
      <ErrorBanner message={error} onClose={() => setError('')} />
      <SuccessBanner message={success} onClose={() => setSuccess('')} />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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
        </div>
        <div className="mt-1 w-full sm:w-48">
          <Button isLoading={isLoading}>Save password</Button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-6">
          Manage your profile, account details, and password
        </p>

        <ProfileHeaderCard user={user} />

        {/* overflow-x-auto keeps the pills usable instead of squashing or
            wrapping awkwardly on narrow screens */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
          ))}
        </div>

        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
        >
          {activeTab === 'profile' && <MyProfileTab />}
          {activeTab === 'email' && <ChangeEmailTab />}
          {activeTab === 'password' && <ChangePasswordTab />}
        </div>
      </div>
    </AppLayout>
  );
}