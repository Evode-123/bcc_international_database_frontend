import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
import * as permissionsApi from '../api/permissions';
import { LEVEL_LABELS, roleLabel } from '../utils/roles';

// What each level of the structure can see. Shown under the table so it's
// clear that permissions say WHAT a role may do, while the level says WHERE.
const LEVEL_DESCRIPTIONS = [
  { level: 'global', text: 'Super Admin and Admin manage everything, in every continent and country.' },
  { level: 'continent', text: 'Continent Overseer sees and manages only the continent they are assigned to.' },
  { level: 'country', text: 'Country Overseer sees and manages only their country, including its centers.' },
  { level: 'site', text: 'Site Coordinator sees and manages only the training site they are assigned to.' },
];

// Human-readable labels for permission names, since "disciple.view" reads
// worse in a table than "View disciples". Also reused to build the clear
// success message below, so the wording stays consistent everywhere.
const PERMISSION_LABELS = {
  'disciple.view': 'View disciples',
  'disciple.create': 'Add disciples',
  'disciple.edit': 'Edit disciples',
  'disciple.delete': 'Delete disciples',
  'report.generate': 'Generate reports',
  'user.manage': 'Manage admin users',
  'location.manage': 'Manage locations (Plan)',
  'role.manage': 'Manage roles & permissions',
};

export function RolesPermissionsPage() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  // Set of "roleId:permissionId" strings -- fast O(1) lookup when
  // rendering each checkbox, rather than searching an array per cell.
  const [grantedSet, setGrantedSet] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Tracks which specific cell is mid-toggle so only that checkbox
  // shows a disabled/pending state, not the whole table.
  const [pendingCell, setPendingCell] = useState(null);

  const loadMatrix = useCallback(async () => {
    setError('');
    try {
      const data = await permissionsApi.fetchPermissionsMatrix();
      setRoles(data.roles);
      setPermissions(data.permissions);
      setGrantedSet(new Set(data.grants.map(([roleId, permissionId]) => `${roleId}:${permissionId}`)));
    } catch (err) {
      setError('Could not load roles and permissions. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  async function handleToggle(roleId, permissionId, currentlyGranted) {
    const cellKey = `${roleId}:${permissionId}`;
    const role = roles.find((r) => r.id === roleId);
    const permission = permissions.find((p) => p.id === permissionId);
    const permissionLabel = permission ? PERMISSION_LABELS[permission.name] || permission.name : 'This permission';
    const roleName = role ? role.label || roleLabel(role.name) : 'this role';

    setPendingCell(cellKey);
    setError('');
    setSuccessMessage('');

    // Optimistic update -- the checkbox flips immediately rather than
    // waiting on the network round trip, then we reconcile with the
    // server's response (or roll back on failure).
    setGrantedSet((prev) => {
      const next = new Set(prev);
      if (currentlyGranted) next.delete(cellKey);
      else next.add(cellKey);
      return next;
    });

    try {
      await permissionsApi.setRolePermission(roleId, permissionId, !currentlyGranted);

      // Clear, specific confirmation -- not just "saved" -- so it's obvious
      // exactly what changed and for whom. Anyone with this role will see
      // the effect (sidebar links, add/edit/delete buttons) the next time
      // they load a page in the app.
      setSuccessMessage(
        currentlyGranted
          ? `"${permissionLabel}" was removed from the ${roleName} role. Anyone with this role will lose access to that action next time they load a page.`
          : `"${permissionLabel}" was granted to the ${roleName} role. Anyone with this role will gain access to that action next time they load a page.`
      );
    } catch (err) {
      // Roll back the optimistic change since the server rejected it.
      setGrantedSet((prev) => {
        const next = new Set(prev);
        if (currentlyGranted) next.add(cellKey);
        else next.delete(cellKey);
        return next;
      });
      setError(
        err.response?.data?.error ||
          `Could not update "${permissionLabel}" for the ${roleName} role. Please try again.`
      );
    } finally {
      setPendingCell(null);
    }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Roles and permissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Check a box to grant a permission to a role. What each role can see is set by its level.
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-1">
        Changes here apply automatically -- there's nothing else to configure. Users with the
        affected role will see the matching buttons and menu items appear or disappear the next
        time they load a page in the app.
      </p>
      {currentUser?.role !== 'super_admin' && (
        <p className="text-xs text-gray-400 mb-4">
          The Super Admin role isn't shown here — only a Super Admin can view or change its permissions.
        </p>
      )}
 
      <ErrorBanner message={error} onClose={() => setError('')} />
      <SuccessBanner message={successMessage} onClose={() => setSuccessMessage('')} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Permission</th>
                {roles.map((role) => (
                  <th key={role.id} className="px-5 py-3 font-medium text-center whitespace-nowrap">
                    <div>{role.label || roleLabel(role.name)}</div>
                    <div className="text-[10px] font-normal uppercase tracking-wide text-gray-400">
                      {LEVEL_LABELS[role.level] || ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-gray-900">
                    {PERMISSION_LABELS[permission.name] || permission.name}
                  </td>
                  {roles.map((role) => {
                    const cellKey = `${role.id}:${permission.id}`;
                    const isGranted = grantedSet.has(cellKey);
                    const isPending = pendingCell === cellKey;
                    return (
                      <td key={role.id} className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isGranted}
                          disabled={isPending}
                          onChange={() => handleToggle(role.id, permission.id, isGranted)}
                          className="w-4 h-4 accent-brand cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3 mt-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">Who sees what</p>
        {LEVEL_DESCRIPTIONS.map((d) => (
          <p key={d.level}>
            <span className="font-medium text-gray-600">{LEVEL_LABELS[d.level]}:</span> {d.text}
          </p>
        ))}
        <p className="pt-1">
          The roles are fixed, so there is no "New role". Changing a box here changes what the
          role may do, always inside its own area.
        </p>
      </div>
    </AppLayout>
  );
}