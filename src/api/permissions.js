import { api } from '../api/client';

export async function fetchPermissionsMatrix() {
  const { data } = await api.get('/permissions/matrix');
  return data; // { roles, permissions, grants: [[roleId, permissionId], ...] }
}

export async function setRolePermission(roleId, permissionId, granted) {
  const { data } = await api.put(`/permissions/roles/${roleId}/permissions/${permissionId}`, {
    granted,
  });
  return data;
}

export async function createRole(name, description) {
  const { data } = await api.post('/permissions/roles', { name, description });
  return data;
}