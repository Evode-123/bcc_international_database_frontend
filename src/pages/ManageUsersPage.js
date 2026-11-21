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
import { useAutoSelectSingle } from '../hooks/useAutoSelectSingle';
import { LEVEL_LABELS, roleBadgeClasses, roleLabel, roleLevel } from '../utils/roles';

// What each level needs the person to pick, and the wording shown to the
// user. 'global' (Super Admin / Admin) needs no location at all.
const LEVEL_COPY = {
  site: {
    heading: 'Training site',
    help: 'This user will only see and manage disciples of this training site.',
    field: 'siteId',
    missing: 'Please select the training site this user belongs to.',
  },
  country: {
    heading: 'Country',
    help: 'This user will see and manage everything in this country, including its centers.',
    field: 'countryId',
    missing: 'Please select the country this user oversees.',
  },
  continent: {
    heading: 'Continent',
    help: 'This user will see and manage everything in this continent.',
    field: 'continentId',
    missing: 'Please select the continent this user oversees.',
  },
};

// Turns the chosen id into the one field the backend expects for that level.
function buildLocation(level, id) {
  const copy = LEVEL_COPY[level];
  if (!copy || !id) return {};
  return { [copy.field]: parseInt(id, 10) };
}

// Picks the ONE location a role needs. The lists come from the backend
// already limited to the area the logged-in person manages, so a Continent
// Overseer only ever sees their own continent here, a Country Overseer only
// their own country, and so on. When a list has a single option it is
// selected automatically.
//
//   level 'continent' -> pick a continent
//   level 'country'   -> continent → country
//   level 'site'      -> continent → country → center → site
function LocationPicker({ level, value, onChange }) {
  const copy = LEVEL_COPY[level];

  const [continents, setContinents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sites, setSites] = useState([]);

  const [continentId, setContinentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [centerId, setCenterId] = useState('');

  const needsCountry = level === 'country' || level === 'site';
  const needsCenter = level === 'site';

  useEffect(() => {
    lookupsApi.fetchContinents().then(setContinents).catch(() => {});
  }, []);

  useEffect(() => {
    if (!needsCountry || !continentId) { setCountries([]); return; }
    lookupsApi.fetchCountries(continentId).then(setCountries).catch(() => {});
  }, [continentId, needsCountry]);

  useEffect(() => {
    if (!needsCenter || !countryId) { setCenters([]); return; }
    lookupsApi.fetchCenters(countryId).then(setCenters).catch(() => {});
  }, [countryId, needsCenter]);

  useEffect(() => {
    if (!needsCenter || !centerId) { setSites([]); return; }
    lookupsApi.fetchSites(centerId).then((s) => {
      setSites(s);
      // Center = site (no separate sub-sites) -- auto-select it silently.
      if (s.length === 1 && s[0].isDefault) onChange(String(s[0].id));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId, needsCenter]);

  // A list with a single option (normal for overseers) is picked for them.
  useAutoSelectSingle(continents, continentId, (id) => {
    setContinentId(id);
    if (level === 'continent') onChange(id);
  });
  useAutoSelectSingle(needsCountry ? countries : [], countryId, (id) => {
    setCountryId(id);
    if (level === 'country') onChange(id);
  });
  useAutoSelectSingle(needsCenter ? centers : [], centerId, setCenterId);

  const showSiteDropdown = sites.length > 0 && !(sites.length === 1 && sites[0].isDefault);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-3.5 mb-4">
      <p className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
        {copy.heading} <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-gray-500 mb-3">{copy.help}</p>

      <Select
        label="Continent"
        value={continentId}
        onChange={(e) => {
          setContinentId(e.target.value);
          setCountryId('');
          setCenterId('');
          onChange(level === 'continent' ? e.target.value : '');
        }}
      >
        <option value="">Select continent</option>
        {continents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      {needsCountry && (
        <Select
          label="Country"
          value={countryId}
          disabled={!continentId}
          onChange={(e) => {
            setCountryId(e.target.value);
            setCenterId('');
            onChange(level === 'country' ? e.target.value : '');
          }}
        >
          <option value="">Select country</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}

      {needsCenter && (
        <Select
          label="Center"
          value={centerId}
          disabled={!countryId}
          onChange={(e) => {
            setCenterId(e.target.value);
            onChange('');
          }}
        >
          <option value="">Select center</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}

      {needsCenter && showSiteDropdown && (
        <Select label="Site" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select site</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      )}

      {needsCenter && centerId && sites.length === 1 && sites[0].isDefault && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
          This center has no separate sites — the center itself is the training site.
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
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${roleBadgeClasses(role)}`}
    >
      {roleLabel(role)}
    </span>
  );
}

// The role dropdown shows the friendly name plus what it covers.
function RoleOptions({ roles }) {
  return roles.map((r) => (
    <option key={r.id} value={r.name}>
      {r.label || roleLabel(r.name)} ({LEVEL_LABELS[r.level || roleLevel(r.name)]})
    </option>
  ));
}

// Where this person works, as one line for the table.
function areaText(user) {
  switch (user.scopeLevel || roleLevel(user.role)) {
    case 'site':
      return (user.centerName ? `${user.centerName} — ${user.siteName}` : user.siteName) || null;
    case 'country':
      return user.countryName || null;
    case 'continent':
      return user.continentName || null;
    default:
      return 'All locations';
  }
}

function InviteUserModal({ roles, onClose, onInvited }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState(roles[0]?.name || '');
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const level = roleLevel(roleName);
  const needsLocation = level !== 'global';

  function handleRoleChange(e) {
    setRoleName(e.target.value);
    setLocationId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (needsLocation && !locationId) {
      setError(LEVEL_COPY[level].missing);
      return;
    }

    setIsLoading(true);
    try {
      await adminUsersApi.inviteAdminUser(
        fullName.trim(),
        email.trim(),
        roleName,
        needsLocation ? buildLocation(level, locationId) : {}
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
          <RoleOptions roles={roles} />
        </Select>

        {needsLocation && (
          // key = level, so switching role resets the pickers cleanly.
          <LocationPicker key={level} level={level} value={locationId} onChange={setLocationId} />
        )}

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
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const level = roleLevel(roleName);
  const needsLocation = level !== 'global';

  // True only while the role is still what it already was AND the user
  // already has a location for it -- then that assignment still applies
  // unless a new one is picked below.
  const existingLocationId =
    level === 'site' ? user.siteId : level === 'country' ? user.countryId : user.continentId;
  const keepsExistingLocation = needsLocation && roleName === user.role && !!existingLocationId;

  function handleRoleChange(e) {
    setRoleName(e.target.value);
    setLocationId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (needsLocation && !locationId && !keepsExistingLocation) {
      setError(LEVEL_COPY[level].missing);
      return;
    }

    setIsLoading(true);
    try {
      await adminUsersApi.updateAdminUserRole(
        user.id,
        roleName,
        needsLocation && locationId ? buildLocation(level, locationId) : {}
      );
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this user's role.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Change role" subtitle={user.fullName || user.email} onClose={onClose}>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <Select label="Role" value={roleName} onChange={handleRoleChange} required>
          <RoleOptions roles={roles} />
        </Select>

        {needsLocation && (
          <>
            {keepsExistingLocation && (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-3 text-xs text-gray-500">
                Currently assigned to {areaText(user) || 'a location'}. Select a new{' '}
                {LEVEL_COPY[level].heading.toLowerCase()} below only if you want to move them.
              </div>
            )}
            <LocationPicker key={level} level={level} value={locationId} onChange={setLocationId} />
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

  // Overseers only see (and can only manage) people below them inside their
  // own area; admins see everyone except Super Admins.
  const level = currentUser?.scope?.level || 'global';
  const visibilityNote =
    currentUser?.role === 'super_admin'
      ? null
      : level === 'global'
        ? "Super Admin accounts aren't shown here — only a Super Admin can view or manage those."
        : 'You only see the users inside your own area, and you can only invite roles below yours.';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} user account{users.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="w-36">
          <Button
            onClick={() => setShowInviteModal(true)}
            type="button"
            disabled={roles.length === 0}
          >
            + Invite user
          </Button>
        </div>
      </div>

      {visibilityNote && <p className="text-xs text-gray-400 mb-4">{visibilityNote}</p>}

      <ErrorBanner message={error} />
      <SuccessBanner message={successMessage} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Area</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-gray-900">{user.fullName || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {areaText(user) || <span className="text-amber-600">Not assigned</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge user={user} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {/* The backend says whether THIS person may manage THIS row. */}
                    {user.canManage && (
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