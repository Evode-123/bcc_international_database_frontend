// src/api/dashboard.js
import { api } from './client';

export async function fetchDashboardStats() {
  const { data } = await api.get('/dashboard/stats');
  return data;
}