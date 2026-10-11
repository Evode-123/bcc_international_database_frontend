import { api } from './client';

function buildForm(file) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// Step 1 -- checks the whole file (up to 20,000 rows) WITHOUT saving anything.
// Returns { totalRows, readyCount, skippedDuplicates, needsAttentionCount,
// rows, rowsTruncated }. `rows` holds only the rows that need a person's
// attention (capped at 500 by the server), so the screen stays fast no matter
// how big the file is.
export async function checkDiscipleImportFile(file) {
  const { data } = await api.post('/disciples/import/commit?dryRun=true', buildForm(file), multipart);
  return data;
}

// Step 2 -- saves every valid row in bulk, in batches, on the server. Rows
// already in the database (same name, phone, graduation year and site) are
// skipped, so importing the same file twice never creates duplicates.
// Returns the same shape as step 1, plus `savedCount`.
export async function commitDiscipleImportFile(file) {
  const { data } = await api.post('/disciples/import/commit', buildForm(file), multipart);
  return data;
}

// Old small-file preview, kept for compatibility (max 2,000 rows).
export async function parseDiscipleImportFile(file) {
  const { data } = await api.post('/disciples/import/parse', buildForm(file), multipart);
  return data;
}