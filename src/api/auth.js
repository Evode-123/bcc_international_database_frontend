import { api } from './client';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function changePassword(newPassword) {
  const { data } = await api.post('/auth/change-password', { newPassword });
  return data;
}

export async function completeProfile(fullName, phoneNumber) {
  const { data } = await api.post('/auth/complete-profile', { fullName, phoneNumber });
  return data;
}

// Requires the current password to be re-confirmed server-side. On
// success, the backend has already changed the email and emailed a
// security notice to the OLD address -- the caller (SettingsPage) is
// responsible for logging the user out and sending them back to /login,
// since the frontend's stored token is now associated with a stale email.
export async function changeEmail(newEmail, currentPassword) {
  const { data } = await api.post('/auth/change-email', { newEmail, currentPassword });
  return data; // { message, email }
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data;
}