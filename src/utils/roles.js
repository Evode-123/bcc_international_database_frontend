// Single place for the role structure on the frontend. Mirrors the backend's
// utils/roleScope.util.ts -- the backend is what actually enforces it; this
// only decides what to show.
//
//   GLOBAL     super_admin, admin        -> everything, everywhere
//   CONTINENT  continent_overseer        -> one continent
//   COUNTRY    country_overseer          -> one country (also manages its centers)
//   SITE       site_coordinator          -> one training site

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  continent_overseer: 'Continent Overseer',
  country_overseer: 'Country Overseer',
  site_coordinator: 'Site Coordinator',
};

export const ROLE_LEVELS = {
  super_admin: 'global',
  admin: 'global',
  continent_overseer: 'continent',
  country_overseer: 'country',
  site_coordinator: 'site',
};

export const LEVEL_LABELS = {
  global: 'Global',
  continent: 'Continent',
  country: 'Country',
  site: 'Training site',
};

export function roleLabel(roleName) {
  if (!roleName) return '';
  return ROLE_LABELS[roleName] || roleName.replace(/_/g, ' ');
}

export function roleLevel(roleName) {
  return ROLE_LEVELS[roleName] || 'global';
}

// Tailwind classes for a role badge, by level.
export function roleBadgeClasses(roleName) {
  switch (roleName) {
    case 'super_admin':
      return 'bg-red-50 text-red-700';
    case 'admin':
      return 'bg-gray-100 text-gray-700';
    case 'continent_overseer':
      return 'bg-violet-50 text-violet-700';
    case 'country_overseer':
      return 'bg-teal-50 text-teal-700';
    case 'site_coordinator':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// The area a logged-in user covers, as short text, e.g. "Rwanda",
// "Africa", "Masoro (ERC)" or "All locations". Uses the `scope` object the
// backend returns from /auth/me and login.
export function scopeSummary(user) {
  const scope = user?.scope;
  if (!scope) return user?.site?.name || 'All locations';

  switch (scope.level) {
    case 'continent':
      return scope.continentName || 'Your continent';
    case 'country':
      return scope.countryName || 'Your country';
    case 'site':
      return [scope.centerName, scope.siteName].filter(Boolean).join(' — ') || 'Your site';
    case 'none':
      return 'No location assigned';
    default:
      return 'All locations';
  }
}

// Which "manage" actions the Plan page should offer. The backend rejects
// anything outside the user's area anyway; this just hides buttons that
// could never work.
export function locationPowers(user) {
  const level = user?.scope?.level || 'global';
  return {
    level,
    canManageContinents: level === 'global',
    canManageCountries: level === 'global' || level === 'continent',
    canManageCenters: level === 'global' || level === 'continent' || level === 'country',
    canManageLanguages: level === 'global',
  };
}