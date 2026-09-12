import { api } from './client';

export async function listAdminUsers() {
  const { data } = await api.get('/admin-users');
  return data;
}

export async function inviteAdminUser(fullName, email, roleName, siteId) {
  const { data } = await api.post('/admin-users/invite', { fullName, email, roleName, siteId });
  return data;
}

export async function setAdminUserActive(userId, isActive) {
  const { data  } = await api.patch(`/admin-users/${userId}/active`, { isActive });
  return data;
}

export async function updateAdminUserRole(userId, roleName, siteId) {
  const { data } = await api.patch(`/admin-users/${userId}/role`, { roleName, siteId });
  return data;
}