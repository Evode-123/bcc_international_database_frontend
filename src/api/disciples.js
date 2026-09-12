import { api } from './client';

export async function listDisciples(filters = {}) {
  const params = {};
  if (filters.search)       params.search       = filters.search;
  if (filters.continentId)  params.continentId  = filters.continentId;
  if (filters.countryId)    params.countryId    = filters.countryId;
  if (filters.centerId)     params.centerId     = filters.centerId;
  if (filters.siteId)       params.siteId       = filters.siteId;
  if (filters.graduationYear) params.graduationYear = filters.graduationYear;

  const { data } = await api.get('/disciples', { params });
  return data; 
}

export async function getDisciple(id) {
  const { data } = await api.get(`/disciples/${id}`);
  return data;
}

export async function createDisciple(payload) {
  const { data } = await api.post('/disciples', payload);
  return data;
}

export async function updateDisciple(id, payload) {
  const { data } = await api.put(`/disciples/${id}`, payload);
  return data;
}

export async function deleteDisciple(id) {
  await api.delete(`/disciples/${id}`);
}

export async function addRepeatAttendance(discipleId, trainingId, attendanceYear, notes) {
  const { data } = await api.post(`/disciples/${discipleId}/repeat-attendance`, {
    trainingId,
    attendanceYear,
    notes,
  });
  return data;
}