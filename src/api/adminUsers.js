import { api } from './client';

export async function listAdminUsers() {
  const { data } = await api.get('/admin-users');
  return data;
}

// `location` is whichever ONE location the role needs:
//   site_coordinator   -> { siteId }
//   country_overseer   -> { countryId }
//   continent_overseer -> { continentId }
//   admin / super_admin -> nothing
export async function inviteAdminUser(fullName, email, roleName, location = {}) {
  const { data } = await api.post('/admin-users/invite', {
    fullName,
    email,
    roleName,
    ...location,
  });
  return data;
}

export async function setAdminUserActive(userId, isActive) {
  const { data } = await api.patch(`/admin-users/${userId}/active`, { isActive });
  return data;
}

export async function updateAdminUserRole(userId, roleName, location = {}) {
  const { data } = await api.patch(`/admin-users/${userId}/role`, { roleName, ...location });
  return data;
}