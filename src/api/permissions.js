import { api } from '../api/client';

// Roles are fixed (Super Admin, Admin, Continent Overseer, Country Overseer,
// Site Coordinator), so there is no createRole any more -- only what each
// role is allowed to do can be changed.

export async function fetchPermissionsMatrix() {
  const { data } = await api.get('/permissions/matrix');
  // { roles: [{ id, name, label, level, description }], permissions, grants: [[roleId, permissionId], ...] }
  return data;
}

export async function setRolePermission(roleId, permissionId, granted) {
  const { data } = await api.put(`/permissions/roles/${roleId}/permissions/${permissionId}`, {
    granted,
  });
  return data;
}