import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { Modal } from '../components/Modal';
import { TextInput } from '../components/TextInput';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
import * as adminUsersApi from '../api/adminUsers';
import * as lookupsApi from '../api/lookups';

// Mirrors the backend's roleScope.util.ts: every role except admin/
// super_admin is tied to exactly one site. Roles are created dynamically
// on the Roles & Permissions page, so this can't be a hardcoded list of
// names -- "leader", or anything else a super_admin names later, is
// site-scoped the same way "teacher" is.
function isSiteScopedRoleName(roleName) {
  return roleName && roleName !== 'admin' && roleName !== 'super_admin';
}

// Continent → country → center → site cascade, reused by both the invite
// and edit-role modals below. Calls onSiteChange(siteId) whenever the
// selected site changes (including back to '' when a parent is reset).
function SiteScopePicker({ siteId, onSiteChange }) {
  const [continents, setContinents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sites, setSites] = useState([]);

  const [continentId, setContinentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [centerId, setCenterId] = useState('');

  useEffect(() => {
    lookupsApi.fetchContinents().then(setContinents).catch(() => {});
  }, []);

  useEffect(() => {
    if (!continentId) { setCountries([]); return; }
    lookupsApi.fetchCountries(continentId).then(setCountries).catch(() => {});
  }, [continentId]);

  useEffect(() => {
    if (!countryId) { setCenters([]); return; }
    lookupsApi.fetchCenters(countryId).then(setCenters).catch(() => {});
  }, [countryId]);

  useEffect(() => {
    if (!centerId) { setSites([]); return; }
    lookupsApi.fetchSites(centerId).then((s) => {
      setSites(s);
      // Center = site (no separate sub-sites) -- auto-select it silently.
      if (s.length === 1 && s[0].isDefault) {
        onSiteChange(String(s[0].id));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId]);

  const showSiteDropdown = sites.length > 0 && !(sites.length === 1 && sites[0].isDefault);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3.5 mb-4">
      <p className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
        Site <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-gray-500 mb-3">
        This user will only see and manage disciples belonging to this site.
      </p>
      <Select
        label="Continent"
        value={continentId}
        onChange={(e) => {
          setContinentId(e.target.value);
          setCountryId('');
          setCenterId('');
          onSiteChange('');
        }}
      >
        <option value="">Select continent</option>
        {continents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select
        label="Country"
        value={countryId}
        disabled={!continentId}
        onChange={(e) => {
          setCountryId(e.target.value);
          setCenterId('');
          onSiteChange('');
        }}
      >
        <option value="">Select country</option>
        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select
        label="Center"
        value={centerId}
        disabled={!countryId}
        onChange={(e) => {
          setCenterId(e.target.value);
          onSiteChange('');
        }}
      >
        <option value="">Select center</option>
        {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      {showSiteDropdown && (
        <Select
          label="Site"
          value={siteId}
          onChange={(e) => onSiteChange(e.target.value)}
        >
          <option value="">Select site</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      )}
      {centerId && sites.length === 1 && sites[0].isDefault && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
          This center has no separate sites — the center itself is the site.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ user }) {
  if (!user.isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Deactivated
      </span>
    );
  }
  if (user.mustChangePassword) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending setup
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Active
    </span>
  );
}

function RoleBadge({ role }) {
  const styles =
    role === 'super_admin'
      ? 'bg-red-50 text-red-700'
      : role === 'admin'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-blue-50 text-blue-700';

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${styles}`}>
      {role}
    </span>
  );
}

function InviteUserModal({ roles, onClose, onInvited }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState(roles[0]?.name || '');
  const [siteId, setSiteId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const needsSite = isSiteScopedRoleName(roleName);

  function handleRoleChange(e) {
    setRoleName(e.target.value);
    setSiteId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (needsSite && !siteId) {
      setError('Please select the site this user belongs to.');
      return;
    }

    setIsLoading(true);
    try {
      await adminUsersApi.inviteAdminUser(
        fullName.trim(),
        email.trim(),
        roleName,
        needsSite ? parseInt(siteId, 10) : undefined
      );
      onInvited();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Invite new user" subtitle="They'll receive a temporary password by email" onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Caleb Bugingo"
          required
          autoFocus
        />
        <TextInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="caleb@example.com"
          required
        />
        <Select label="Role" value={roleName} onChange={handleRoleChange} required>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>

        {needsSite && <SiteScopePicker siteId={siteId} onSiteChange={setSiteId} />}

        <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-5 text-xs text-gray-500">
          A temporary password will be sent to this email. They'll be required to change it
          and complete their profile on first login.
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="w-32">
            <Button isLoading={isLoading}>Send invite</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function EditRoleModal({ user, roles, onClose, onUpdated }) {
  const [roleName, setRoleName] = useState(user.role);
  const [siteId, setSiteId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const needsSite = isSiteScopedRoleName(roleName);
  // True only when the role hasn't actually changed from what it already
  // was -- in that case the user's existing site assignment still applies
  // unless they explicitly pick a new one below.
  const keepsExistingSite = needsSite && roleName === user.role && !!user.siteId;

  function handleRoleChange(e) {
    setRoleName(e.target.value);
    setSiteId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (needsSite && !siteId && !keepsExistingSite) {
      setError('Please select the site this user belongs to.');
      return;
    }

    setIsLoading(true);
    try {
      await adminUsersApi.updateAdminUserRole(
        user.id,
        roleName,
        needsSite && siteId ? parseInt(siteId, 10) : undefined
      );
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this user\'s role.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Change role" subtitle={user.fullName || user.email} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <Select label="Role" value={roleName} onChange={handleRoleChange} required>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </Select>

        {needsSite && (
          <>
            {keepsExistingSite && (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-3 text-xs text-gray-500">
                Currently assigned to {user.centerName ? `${user.centerName} — ` : ''}
                {user.siteName || 'a site'}. Select a site below only if you want to move them.
              </div>
            )}
            <SiteScopePicker siteId={siteId} onSiteChange={setSiteId} />
          </>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="w-32">
            <Button isLoading={isLoading}>Save role</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingRoleUser, setEditingRoleUser] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [usersData, rolesData] = await Promise.all([
        adminUsersApi.listAdminUsers(),
        lookupsApi.fetchRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setError('Could not load users. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleActive(user) {
    setError('');
    try {
      await adminUsersApi.setAdminUserActive(user.id, !user.isActive);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update that user.');
    }
  }

  function handleInvited() {
    setShowInviteModal(false);
    setSuccessMessage('Invite sent successfully.');
    loadData();
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} admin account{users.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="w-36">
          <Button onClick={() => setShowInviteModal(true)} type="button">
            + Invite user
          </Button>
        </div>
      </div>
 
      {/* Only shown to non-Super-Admins, so it's clear the list isn't
          incomplete by accident -- Super Admin accounts are simply not
          shown to (or manageable by) anyone else. */}
      {currentUser?.role !== 'super_admin' && (
        <p className="text-xs text-gray-400 mb-4">
          Super Admin accounts aren't shown here — only a Super Admin can view or manage those.
        </p>
      )}

      <ErrorBanner message={error} />
      <SuccessBanner message={successMessage} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-gray-900">{user.fullName || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {isSiteScopedRoleName(user.role)
                      ? (user.centerName ? `${user.centerName} — ${user.siteName}` : user.siteName) || '—'
                      : <span className="text-gray-400">All sites</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge user={user} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.role !== 'super_admin' && (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditingRoleUser(user)}
                          className="text-sm text-gray-500 hover:text-gray-800"
                        >
                          Edit role
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`text-sm ${
                            user.isActive
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInviteModal && (
        <InviteUserModal
          roles={roles}
          onClose={() => setShowInviteModal(false)}
          onInvited={handleInvited}
        />
      )}

      {editingRoleUser && (
        <EditRoleModal
          user={editingRoleUser}
          roles={roles}
          onClose={() => setEditingRoleUser(null)}
          onUpdated={() => {
            setEditingRoleUser(null);
            setSuccessMessage('Role updated successfully.');
            loadData();
          }}
        />
      )}
    </AppLayout>
  );
}