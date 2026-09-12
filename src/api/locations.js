import { api } from './client';

export async function fetchLocationsTree() {
  const { data } = await api.get('/locations/tree');
  // Returns: { continents: [{ id, name, countries: [{ ..., centers: [{ ..., sites }] }] }], languages }
  return data;
}

export async function createContinent(name) {
  const { data } = await api.post('/locations/continents', { name });
  return data;
}
export async function updateContinent(id, name) {
  const { data } = await api.put(`/locations/continents/${id}`, { name });
  return data;
}
export async function deleteContinent(id) {
  await api.delete(`/locations/continents/${id}`);
}

export async function createCountry(name, continentId) {
  const { data } = await api.post('/locations/countries', { name, continentId });
  return data;
}
export async function updateCountry(id, fields) {
  const { data } = await api.put(`/locations/countries/${id}`, fields);
  return data;
}
export async function deleteCountry(id) {
  await api.delete(`/locations/countries/${id}`);
}

// hasSites: false = backend auto-creates a default site with the center's name
//           true  = admin will add sites manually afterwards
export async function createCenter(name, countryId, hasSites) {
  const { data } = await api.post('/locations/centers', { name, countryId, hasSites });
  return data;
}
export async function updateCenter(id, fields) {
  const { data } = await api.put(`/locations/centers/${id}`, fields);
  return data;
}
export async function deleteCenter(id) {
  await api.delete(`/locations/centers/${id}`);
}

export async function createSite(name, centerId) {
  const { data } = await api.post('/locations/sites', { name, centerId });
  return data;
}
export async function updateSite(id, fields) {
  const { data } = await api.put(`/locations/sites/${id}`, fields);
  return data;
}
export async function deleteSite(id) {
  await api.delete(`/locations/sites/${id}`);
}

export async function createLanguage(name) {
  const { data } = await api.post('/locations/languages', { name });
  return data;
}
export async function deleteLanguage(id) {
  await api.delete(`/locations/languages/${id}`);
}