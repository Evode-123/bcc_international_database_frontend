import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { AppLayout } from '../components/AppLayout';
import { ConfirmModal } from '../components/Modal';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';
import { parseDiscipleImportFile } from '../api/discipleImport';

const GENDERS = ['Male', 'Female'];
const TRAINING_MODES = ['Online', 'In-person'];

const TEMPLATE_COLUMNS = [
  'familyName', 'otherNames', 'gender', 'dateOfBirth',
  'phoneNumber', 'email', 'city', 'fellowshipChurch',
  'continent', 'country', 'center', 'site',
  'graduationYear', 'trainingMode', 'trainingLanguage',
];
 
const TEMPLATE_EXAMPLE_ROW = [
  'Mukiza', 'Esther', 'Female', '1990-04-12',
  '+250780000000', 'esther@example.com', 'Kigali', 'Grace Fellowship',
  'Africa', 'Rwanda', 'ERC', 'Masoro',
  '2025', 'In-person', 'Kinyarwanda',
];

function downloadTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, TEMPLATE_EXAMPLE_ROW]);
  worksheet['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 18 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Disciples');
  XLSX.writeFile(workbook, 'bcc-disciples-import-template.xlsx');
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
    invalid: 'bg-red-50 text-red-700 border-red-200',
    saved: 'bg-brand-pale text-brand border-brand/20',
  };
  const labels = {
    ready: 'Ready',
    needs_review: 'Needs review',
    invalid: 'Missing info',
    saved: 'Saved',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Per-row edit panel ───────────────────────────────────────────────────────
// Reuses the same continent -> country -> center -> site cascade the manual
// forms use, pre-loaded from the row's best-guess resolvedIds/suggestions,
// so fixing a typo is "pick from a dropdown" rather than "retype it exactly."
function RowEditPanel({ row, continents, languages, onChange, onCancel }) {
  const [countries, setCountries] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sites, setSites] = useState([]);

  const [familyName, setFamilyName] = useState(row.edited.familyName);
  const [graduationYear, setGraduationYear] = useState(row.edited.graduationYear);
  const [gender, setGender] = useState(row.edited.gender || '');
  const [trainingMode, setTrainingMode] = useState(row.edited.trainingMode || '');
  const [trainingLanguageId, setTrainingLanguageId] = useState(row.edited.trainingLanguageId || '');

  const [continentId, setContinentId] = useState(row.edited.continentId || '');
  const [countryId, setCountryId] = useState(row.edited.countryId || '');
  const [centerId, setCenterId] = useState(row.edited.centerId || '');
  const [trainingSiteId, setTrainingSiteId] = useState(row.edited.trainingSiteId || '');

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
      if (s.length === 1 && s[0].isDefault) setTrainingSiteId(String(s[0].id));
    }).catch(() => {});
  }, [centerId]);

  const showSiteDropdown = sites.length > 0 && !(sites.length === 1 && sites[0].isDefault);

  function handleSave() {
    onChange({
      familyName: familyName.trim(),
      graduationYear,
      gender,
      trainingMode,
      trainingLanguageId: trainingLanguageId || undefined,
      continentId: continentId || undefined,
      countryId: countryId || undefined,
      centerId: centerId || undefined,
      trainingSiteId: trainingSiteId || undefined,
    });
  }

  return (
    <div className="bg-amber-50/50 border-t border-amber-100 px-4 py-4 space-y-3">
      {row.errors.length > 0 && (
        <ul className="text-xs text-amber-800 space-y-0.5 mb-2">
          {row.errors.map((e, i) => <li key={i}>• {e}</li>)}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Family name *</span>
          <input value={familyName} onChange={(e) => setFamilyName(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Graduation year *</span>
          <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Continent</span>
          <select value={continentId}
            onChange={(e) => { setContinentId(e.target.value); setCountryId(''); setCenterId(''); setTrainingSiteId(''); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">Select continent</option>
            {continents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</span>
          <select value={countryId} disabled={!continentId}
            onChange={(e) => { setCountryId(e.target.value); setCenterId(''); setTrainingSiteId(''); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400">
            <option value="">Select country</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Center</span>
        <select value={centerId} disabled={!countryId}
          onChange={(e) => { setCenterId(e.target.value); setTrainingSiteId(''); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400">
          <option value="">Select center</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      {showSiteDropdown && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Site</span>
          <select value={trainingSiteId} onChange={(e) => setTrainingSiteId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">Select site</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      {centerId && sites.length === 1 && sites[0].isDefault && (
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          This center has no separate sites — the center itself is the training site.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gender</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">—</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Training mode</span>
          <select value={trainingMode} onChange={(e) => setTrainingMode(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">—</option>
            {TRAINING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Training language</span>
        <select value={trainingLanguageId} onChange={(e) => setTrainingLanguageId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">—</option>
          {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
          Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg">
          Confirm row
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function DiscipleExcelImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [continents, setContinents] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState([]); // [{ key, status, errors, edited, resolvedIds, suggestions, raw }]
  const [expandedKey, setExpandedKey] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [totalSaved, setTotalSaved] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    lookupsApi.fetchContinents().then(setContinents).catch(() => {});
    lookupsApi.fetchLanguages().then(setLanguages).catch(() => {});
  }, []);

  function computeStatus(edited) {
    if (!edited.familyName || !edited.graduationYear) return 'invalid';
    if (!edited.trainingSiteId) return 'needs_review';
    return 'ready';
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setIsParsing(true);
    setRows([]);
    setTotalSaved(0);
    try {
      const result = await parseDiscipleImportFile(file);
      const mapped = result.rows.map((r) => ({
        key: r.rowNumber,
        status: r.status,
        errors: r.errors,
        raw: r.raw,
        suggestions: r.suggestions,
        edited: {
          familyName: r.payload.familyName,
          otherNames: r.payload.otherNames,
          gender: r.payload.gender,
          dateOfBirth: r.payload.dateOfBirth,
          phoneNumber: r.payload.phoneNumber,
          email: r.payload.email,
          city: r.payload.city,
          fellowshipChurch: r.payload.fellowshipChurch,
          graduationYear: r.payload.training.graduationYear || '',
          trainingMode: r.payload.training.trainingMode,
          trainingLanguageId: r.payload.training.trainingLanguageId,
          continentId: r.resolvedIds.continentId,
          countryId: r.resolvedIds.countryId,
          centerId: r.resolvedIds.centerId,
          trainingSiteId: r.payload.trainingSiteId,
        },
      }));
      setRows(mapped);
    } catch (err) {
      setParseError(err.response?.data?.error || 'Could not read this file. Please check the format and try again.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRowFixed(key, patch) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const edited = { ...r.edited, ...patch };
        return { ...r, edited, status: computeStatus(edited), errors: [] };
      })
    );
    setExpandedKey(null);
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const readyRows = rows.filter((r) => r.status === 'ready');
  const pendingRows = rows.filter((r) => r.status !== 'ready' && r.status !== 'saved');

  function handleLeave() {
    if (rows.length > 0) {
      setShowLeaveConfirm(true);
      return;
    }
    navigate('/disciples');
  }

  async function handleSaveReady() {
    if (readyRows.length === 0) return;
    setIsSaving(true);
    setSaveProgress({ done: 0, total: readyRows.length });

    let saved = 0;
    const failedKeys = new Set();

    for (let i = 0; i < readyRows.length; i++) {
      const row = readyRows[i];
      try {
        await disciplesApi.createDisciple({
          familyName: row.edited.familyName,
          otherNames: row.edited.otherNames || undefined,
          gender: row.edited.gender || undefined,
          dateOfBirth: row.edited.dateOfBirth || undefined,
          phoneNumber: row.edited.phoneNumber || undefined,
          email: row.edited.email || undefined,
          city: row.edited.city || undefined,
          fellowshipChurch: row.edited.fellowshipChurch || undefined,
          trainingSiteId: parseInt(row.edited.trainingSiteId, 10),
          training: {
            graduationYear: parseInt(row.edited.graduationYear, 10),
            trainingMode: row.edited.trainingMode || undefined,
            trainingLanguageId: row.edited.trainingLanguageId
              ? parseInt(row.edited.trainingLanguageId, 10)
              : undefined,
            trainingSiteId: parseInt(row.edited.trainingSiteId, 10),
          },
        });
        saved++;
      } catch {
        failedKeys.add(row.key);
      }
      setSaveProgress({ done: i + 1, total: readyRows.length });
    }

    setRows((prev) =>
      prev
        .filter((r) => r.status !== 'ready' || failedKeys.has(r.key))
        .map((r) => (failedKeys.has(r.key) ? { ...r, status: 'needs_review', errors: ['Could not be saved — please review and try again.'] } : r))
    );
    setTotalSaved((prev) => prev + saved);
    setIsSaving(false);
    setSaveProgress(null);
  }

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-gray-900">Import disciples from Excel</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeave}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors whitespace-nowrap"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to directory
            </button>
            <button onClick={handleLeave} className="text-gray-400 hover:text-gray-600 text-xl leading-none" type="button">
              &times;
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Upload a spreadsheet, fix anything flagged, then save. Nothing is written to the database until you click "Save."
        </p>

        {/* Upload card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="button" onClick={downloadTemplate}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-brand/25 text-brand hover:bg-brand-pale transition-all whitespace-nowrap">
              Download template
            </button>
            <label className="flex-1">
              <span className="sr-only">Choose file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isParsing}
                className="block w-full text-sm text-gray-600
                           file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0
                           file:text-sm file:font-semibold file:bg-brand file:text-white
                           hover:file:bg-brand-dark file:cursor-pointer disabled:opacity-50"
              />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Location columns (continent, country, center, site) must use the exact names already set up under
            Plan → Locations. Anything that doesn't match will be flagged below for you to fix or pick from a dropdown.
          </p>
          {isParsing && <p className="text-sm text-brand mt-3">Reading file…</p>}
          {parseError && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {parseError}
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {readyRows.length} ready
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {pendingRows.length} need review
              </span>
              {totalSaved > 0 && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-pale text-brand border border-brand/20">
                  {totalSaved} saved this session
                </span>
              )}
            </div>

            {/* Pending list */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
              {rows.map((row) => (
                <div key={row.key} className="border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {row.key}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {row.edited.familyName || <span className="text-red-500 italic">Missing family name</span>}
                        {row.edited.otherNames ? ` ${row.edited.otherNames}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[row.raw.continent, row.raw.country, row.raw.center, row.raw.site].filter(Boolean).join(' › ') || '—'}
                        {row.edited.graduationYear ? ` · Grad. ${row.edited.graduationYear}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                    {row.status !== 'ready' && (
                      <button type="button"
                        onClick={() => setExpandedKey(expandedKey === row.key ? null : row.key)}
                        className="text-xs font-semibold text-brand hover:underline whitespace-nowrap">
                        {expandedKey === row.key ? 'Close' : 'Fix'}
                      </button>
                    )}
                    <button type="button" onClick={() => removeRow(row.key)}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none" title="Remove from list">
                      ×
                    </button>
                  </div>

                  {expandedKey === row.key && (
                    <RowEditPanel
                      row={row}
                      continents={continents}
                      languages={languages}
                      onChange={(patch) => handleRowFixed(row.key, patch)}
                      onCancel={() => setExpandedKey(null)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Save bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {isSaving && saveProgress ? (
                  <div className="w-48">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Saving…</span>
                      <span>{saveProgress.done} / {saveProgress.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${(saveProgress.done / saveProgress.total) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {pendingRows.length > 0
                      ? `${pendingRows.length} row${pendingRows.length === 1 ? '' : 's'} still need review and won't be saved yet.`
                      : 'All rows are ready.'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveReady}
                disabled={readyRows.length === 0 || isSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isSaving ? 'Saving…' : `Save ${readyRows.length} ready disciple${readyRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}

        {showLeaveConfirm && (
          <ConfirmModal
            title="Leave without saving?"
            message="You have an imported file with rows not yet saved. Leaving now will discard them."
            confirmLabel="Yes, leave"
            cancelLabel="Stay on this page"
            isDanger
            onConfirm={() => navigate('/disciples')}
            onClose={() => setShowLeaveConfirm(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}