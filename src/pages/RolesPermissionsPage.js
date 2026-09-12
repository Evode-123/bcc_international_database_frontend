import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { Modal } from '../components/Modal';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
import * as permissionsApi from '../api/permissions';

function NewRoleModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await permissionsApi.createRole(name.trim(), description.trim() || undefined);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the role.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="New role" subtitle="Starts with no permissions granted" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Role name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. coordinator"
          required
          autoFocus
        />
        <TextInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="w-32">
            <Button isLoading={isLoading}>Create role</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

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
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
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
    const roleLabel = role?.name?.replace(/_/g, ' ') || 'this role';

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
          ? `"${permissionLabel}" was removed from the ${roleLabel} role. Anyone with this role will lose access to that action next time they load a page.`
          : `"${permissionLabel}" was granted to the ${roleLabel} role. Anyone with this role will gain access to that action next time they load a page.`
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
          `Could not update "${permissionLabel}" for the ${roleLabel} role. Please try again.`
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
          <p className="text-sm text-gray-500 mt-0.5">Check a box to grant a permission to a role</p>
        </div>
        <div className="w-32">
          <Button variant="secondary" type="button" onClick={() => setShowNewRoleModal(true)}>
            + New role
          </Button>
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
                  <th key={role.id} className="px-5 py-3 font-medium text-center whitespace-nowrap capitalize">
                    {role.name.replace(/_/g, ' ')}
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

      <div className="bg-gray-50 rounded-lg px-3 py-2.5 mt-4 text-xs text-gray-500">
        Creating a new role starts with zero permissions checked — switch on only what that
        role needs.
      </div>

      {showNewRoleModal && (
        <NewRoleModal
          onClose={() => setShowNewRoleModal(false)}
          onCreated={() => {
            setShowNewRoleModal(false);
            setSuccessMessage('New role created. It starts with no permissions — turn on what it needs above.');
            loadMatrix();
          }}
        />
      )}
    </AppLayout>
  );
}