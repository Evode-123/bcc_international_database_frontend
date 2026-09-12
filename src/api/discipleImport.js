import { api } from './client';

// Uploads the Excel file for read-only parsing/preview -- nothing is
// saved to the database by this call. Returns { rows, totalRows,
// readyCount, needsReviewCount, invalidCount }, where each row already
// carries a ready-to-submit `payload` (see discipleImport.controller.ts
// on the backend) once its location/enum fields are fully resolved.
export async function parseDiscipleImportFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/disciples/import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
} 