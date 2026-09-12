import { api } from './client';

export async function fetchRoles() {
  const { data } = await api.get('/lookups/roles');
  return data;
}

export async function fetchContinents() {
  const { data } = await api.get('/lookups/continents');
  return data;
}

export async function fetchCountries(continentId) {
  const { data } = await api.get('/lookups/countries', {
    params: continentId ? { continentId } : {},
  });
  return data;
}

// Returns centers filtered by country.
// Called when the user selects a country in the disciple form.
export async function fetchCenters(countryId) {
  const { data } = await api.get('/lookups/centers', {
    params: countryId ? { countryId } : {},
  });
  return data;
}

// Returns sites filtered by center.
// Called when the user selects a center in the disciple form.
// Response includes isDefault so the UI can hide the site dropdown
// when only a single default site exists.
export async function fetchSites(centerId) {
  const { data } = await api.get('/lookups/sites', {
    params: centerId ? { centerId } : {},
  });
  return data;
}

export async function fetchLanguages() {
  const { data } = await api.get('/lookups/languages');
  return data;
}