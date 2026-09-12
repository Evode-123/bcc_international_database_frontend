import { forwardRef, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS = ['Male', 'Female'];
const TRAINING_MODES = ['Online', 'In-person'];

// Computes a whole-number age from a 'YYYY-MM-DD' date-of-birth string,
// purely for the little "Age: NN years" hint under the date picker. Age
// itself is never stored -- it's derived on the fly so it's never stale
// (mirrors the same helper used in DiscipleFormModal.js / DiscipleFormPage.js).
function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age >= 0 ? age : null;
}

function emptyEntry() {
  return {
    familyName: '',
    otherNames: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    city: '',
    fellowshipChurch: '',
    graduationYear: new Date().getFullYear(),
    trainingMode: '',
    trainingLanguageId: '',
  };
}

// ─── Small components ─────────────────────────────────────────────────────────

function StepBadge({ n, active, done }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
        done
          ? 'bg-teal-500 text-white'
          : active
          ? 'bg-brand text-white'
          : 'bg-gray-200 text-gray-500'
      }`}
    >
      {done ? '✓' : n}
    </span>
  );
}

function StagedRow({ entry, index, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 border-b border-gray-100 last:border-0 group">
      <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {entry.familyName}
          {entry.otherNames ? ` ${entry.otherNames}` : ''}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {[
            entry.gender,
            entry.graduationYear ? `Grad. ${entry.graduationYear}` : '',
            entry.trainingMode,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none opacity-0 group-hover:opacity-100
                   sm:opacity-0 sm:group-hover:opacity-100"
        title="Remove from list"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

// Inline field: compact label + input for the entry form
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

const CompactInput = forwardRef(function CompactInput(
  { value, onChange, placeholder, type = 'text', required, autoFocus },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand
                 placeholder:text-gray-300 bg-white"
    />
  );
});

function CompactSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white
                 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
    >
      {children}
    </select>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DiscipleBulkAddPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Non-null only for site-scoped roles (teacher, leader, or any other
  // non-admin role) -- see auth.controller.ts's shapeSiteInfo. When set,
  // the whole "pick a location" step below is skipped: every disciple in
  // this batch goes to this exact site, matching what the backend enforces
  // independently on each save.
  const lockedSite = user?.site || null;

  // ── Location state (shared for all disciples in this session) ──────────────
  const [continents, setContinents] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [continentId, setContinentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [trainingSiteId, setTrainingSiteId] = useState('');
  const [countries, setCountries] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sites, setSites] = useState([]);
  const [locationLocked, setLocationLocked] = useState(false);

  // ── Entry form state ───────────────────────────────────────────────────────
  const [entry, setEntry] = useState(emptyEntry());
  const [entryError, setEntryError] = useState('');
  const familyNameRef = useRef(null);

  // ── Staged list (pending save) ─────────────────────────────────────────────
  const [staged, setStaged] = useState([]);

  // ── Save state ─────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null); // { done, total }
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [totalSaved, setTotalSaved] = useState(0);

  // ── Load reference data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!lockedSite) {
      lookupsApi.fetchContinents().then(setContinents).catch(() => {});
    }
    lookupsApi.fetchLanguages().then(setLanguages).catch(() => {});
  }, [lockedSite]);

  // Site-scoped users skip the location step entirely -- pre-fill and lock
  // it to their own site the moment the page loads.
  useEffect(() => {
    if (lockedSite) {
      setTrainingSiteId(String(lockedSite.id));
      setLocationLocked(true);
    }
  }, [lockedSite]);

  useEffect(() => {
    setCountryId('');
    setCountries([]);
    setCenterId('');
    setCenters([]);
    setTrainingSiteId('');
    setSites([]);
    if (continentId) {
      lookupsApi.fetchCountries(continentId).then(setCountries).catch(() => {});
    }
  }, [continentId]);

  useEffect(() => {
    setCenterId('');
    setCenters([]);
    setTrainingSiteId('');
    setSites([]);
    if (countryId) {
      lookupsApi.fetchCenters(countryId).then(setCenters).catch(() => {});
    }
  }, [countryId]);

  useEffect(() => {
    setTrainingSiteId('');
    setSites([]);
    if (centerId) {
      lookupsApi.fetchSites(centerId).then((s) => {
        setSites(s);
        // Auto-select the default site so the user doesn't have to
        if (s.length === 1 && s[0].isDefault) {
          setTrainingSiteId(String(s[0].id));
        }
      }).catch(() => {});
    }
  }, [centerId]);

  // ── Location helpers ───────────────────────────────────────────────────────
  const showSiteDropdown = sites.length > 0 && !(sites.length === 1 && sites[0].isDefault);
  const locationReady = !!trainingSiteId;

  const selectedCenterName = lockedSite ? (lockedSite.centerName || '') : (centers.find((c) => String(c.id) === centerId)?.name || '');
  const selectedCountryName = lockedSite ? (lockedSite.countryName || '') : (countries.find((c) => String(c.id) === countryId)?.name || '');
  const selectedContinentName = lockedSite ? '' : (continents.find((c) => String(c.id) === continentId)?.name || '');
  const selectedSiteName = lockedSite
    ? lockedSite.name
    : sites.length === 1 && sites[0].isDefault
      ? selectedCenterName
      : sites.find((s) => String(s.id) === trainingSiteId)?.name || '';

  function locationSummary() {
    return [selectedContinentName, selectedCountryName, selectedCenterName, selectedSiteName]
      .filter(Boolean)
      .join(' › ');
  }

  function lockLocation() {
    if (!locationReady) return;
    setLocationLocked(true);
    setSuccessMessage('');
    setSaveError('');
    setTimeout(() => familyNameRef.current?.focus(), 50);
  }

  function unlockLocation() {
    if (lockedSite) return; // site-scoped users can't change their assigned site
    if (staged.length > 0) {
      if (!window.confirm('Changing the location will clear your staged list. Continue?')) return;
      setStaged([]);
    }
    setLocationLocked(false);
    setTotalSaved(0);
    setSuccessMessage('');
    setSaveError('');
  }

  // ── Entry form ─────────────────────────────────────────────────────────────
  function setField(field, value) {
    setEntry((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddToList(e) {
    e.preventDefault();
    setEntryError('');

    if (!entry.familyName.trim()) {
      setEntryError('Family name is required.');
      return;
    }
    if (!entry.graduationYear) {
      setEntryError('Graduation year is required.');
      return;
    }

    setStaged((prev) => [...prev, { ...entry }]);
    setEntry(emptyEntry());
    setSuccessMessage('');
    setSaveError('');

    setTimeout(() => familyNameRef.current?.focus(), 50);
  }

  function removeFromStaged(index) {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Save batch ─────────────────────────────────────────────────────────────
  async function handleSaveBatch() {
    if (staged.length === 0) return;
    setIsSaving(true);
    setSaveError('');
    setSuccessMessage('');
    setSaveProgress({ done: 0, total: staged.length });

    let savedCount = 0;
    const failed = [];

    for (let i = 0; i < staged.length; i++) {
      const e = staged[i];
      try {
        await disciplesApi.createDisciple({
          familyName: e.familyName.trim(),
          otherNames: e.otherNames.trim() || undefined,
          gender: e.gender || undefined,
          dateOfBirth: e.dateOfBirth || undefined,
          phoneNumber: e.phoneNumber.trim() || undefined,
          email: e.email.trim() || undefined,
          city: e.city.trim() || undefined,
          fellowshipChurch: e.fellowshipChurch.trim() || undefined,
          trainingSiteId: parseInt(trainingSiteId, 10),
          training: {
            graduationYear: parseInt(e.graduationYear, 10),
            trainingMode: e.trainingMode || undefined,
            trainingLanguageId: e.trainingLanguageId
              ? parseInt(e.trainingLanguageId, 10)
              : undefined,
            trainingSiteId: parseInt(trainingSiteId, 10),
          },
        });
        savedCount++;
        setSaveProgress({ done: i + 1, total: staged.length });
      } catch (err) {
        failed.push({
          name: `${e.familyName} ${e.otherNames || ''}`.trim(),
          reason: err.response?.data?.error || 'Unknown error',
        });
      }
    }

    setIsSaving(false);
    setSaveProgress(null);
    setTotalSaved((prev) => prev + savedCount);

    if (failed.length === 0) {
      // All saved — clear the list and keep going
      setStaged([]);
      setSuccessMessage(
        `${savedCount} disciple${savedCount === 1 ? '' : 's'} saved successfully. You can keep adding more.`
      );
      setTimeout(() => familyNameRef.current?.focus(), 50);
    } else {
      // Partial failure — keep failed ones in the list
      const failedNames = new Set(failed.map((f) => f.name));
      setStaged((prev) =>
        prev.filter((e) =>
          failedNames.has(`${e.familyName} ${e.otherNames || ''}`.trim())
        )
      );
      if (savedCount > 0) {
        setSuccessMessage(`${savedCount} saved.`);
      }
      setSaveError(
        `${failed.length} disciple${failed.length === 1 ? '' : 's'} could not be saved: ` +
          failed.map((f) => `${f.name} (${f.reason})`).join('; ')
      );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const entryAgeHint = (() => {
    const age = calculateAge(entry.dateOfBirth);
    return age !== null ? `Age: ${age} years` : undefined;
  })();

  return (
    <AppLayout>
      <div className="max-w-5xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bulk add disciples</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set a shared location, then add disciples one by one and save them in batches
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {totalSaved > 0 && (
              <span className="text-sm text-teal-600 font-medium whitespace-nowrap">
                {totalSaved} saved this session
              </span>
            )}
            <button
              onClick={() => navigate('/disciples')}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 whitespace-nowrap"
              type="button"
            >
              Done — view directory
            </button>
          </div>
        </div>

        {/* Stacks vertically until the lg breakpoint, where there's enough
            width for the entry form and the staged-list panel to sit side
            by side. Below lg, the staged list moves under the form and is
            no longer sticky, so it never overlaps content or gets cut off
            on narrow/short mobile viewports. */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left column: location + entry form ── */}
          <div className="flex-1 min-w-0 w-full space-y-4">

            {/* ── Step 1: Location ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <StepBadge n={1} active={!locationLocked} done={locationLocked} />
                <span className="text-sm font-semibold text-gray-800">Training location</span>
                <span className="text-xs text-gray-400 ml-0.5 hidden sm:inline">— shared for all disciples in this batch</span>
                {locationLocked && !lockedSite && (
                  <button
                    onClick={unlockLocation}
                    className="ml-auto text-xs text-brand hover:underline"
                    type="button"
                  >
                    Change
                  </button>
                )}
              </div>

              {locationLocked ? (
                <div className="px-5 py-3.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">{locationSummary()}</span>
                  {sites.length === 1 && sites[0].isDefault && (
                    <span className="text-xs text-gray-400">(center = site)</span>
                  )}
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Continent
                      </label>
                      <select
                        value={continentId}
                        onChange={(e) => setContinentId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="">Select continent</option>
                        {continents.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Country
                      </label>
                      <select
                        value={countryId}
                        onChange={(e) => setCountryId(e.target.value)}
                        disabled={!continentId}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">Select country</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Center
                    </label>
                    <select
                      value={centerId}
                      onChange={(e) => setCenterId(e.target.value)}
                      disabled={!countryId}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select center</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {showSiteDropdown && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Site
                      </label>
                      <select
                        value={trainingSiteId}
                        onChange={(e) => setTrainingSiteId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="">Select site</option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {centerId && sites.length === 1 && sites[0].isDefault && (
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      This center has no separate sites — the center itself is the training site.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={lockLocation}
                      disabled={!locationReady}
                      className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white
                                 hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Confirm location →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 2: Entry form ── */}
            <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-opacity ${!locationLocked ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <StepBadge n={2} active={locationLocked} done={false} />
                <span className="text-sm font-semibold text-gray-800">Add a disciple</span>
                <span className="text-xs text-gray-400 ml-0.5 hidden sm:inline">— fill in and click "Add to list"</span>
              </div>

              <form onSubmit={handleAddToList} className="p-5 space-y-4">
                {entryError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {entryError}
                  </div>
                )}

                {/* Row 1: names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Family name *">
                    <CompactInput
                      ref={familyNameRef}
                      value={entry.familyName}
                      onChange={(e) => setField('familyName', e.target.value)}
                      placeholder="e.g. Mukiza"
                      required
                      autoFocus
                    />
                  </Field>
                  <Field label="Other names">
                    <CompactInput
                      value={entry.otherNames}
                      onChange={(e) => setField('otherNames', e.target.value)}
                      placeholder="e.g. Esther"
                    />
                  </Field>
                </div>

                {/* Row 2: gender + date of birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Gender">
                    <CompactSelect value={entry.gender} onChange={(e) => setField('gender', e.target.value)}>
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </CompactSelect>
                  </Field>
                  <Field label="Date of birth">
                    <CompactInput
                      type="date"
                      value={entry.dateOfBirth}
                      onChange={(e) => setField('dateOfBirth', e.target.value)}
                    />
                    {entryAgeHint && (
                      <span className="text-xs text-gray-400 mt-0.5">{entryAgeHint}</span>
                    )}
                  </Field>
                </div>

                {/* Row 3: phone + email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Phone number">
                    <CompactInput
                      value={entry.phoneNumber}
                      onChange={(e) => setField('phoneNumber', e.target.value)}
                      placeholder="+250 7..."
                    />
                  </Field>
                  <Field label="Email">
                    <CompactInput
                      type="email"
                      value={entry.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="optional"
                    />
                  </Field>
                </div>

                {/* Row 4: city + church */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Current city">
                    <CompactInput
                      value={entry.city}
                      onChange={(e) => setField('city', e.target.value)}
                      placeholder="e.g. Kigali"
                    />
                  </Field>
                  <Field label="Fellowship church">
                    <CompactInput
                      value={entry.fellowshipChurch}
                      onChange={(e) => setField('fellowshipChurch', e.target.value)}
                      placeholder="Their home church"
                    />
                  </Field>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 pt-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Training details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Graduation year *">
                      <CompactInput
                        type="number"
                        value={entry.graduationYear}
                        onChange={(e) => setField('graduationYear', e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Training mode">
                      <CompactSelect value={entry.trainingMode} onChange={(e) => setField('trainingMode', e.target.value)}>
                        <option value="">Select mode</option>
                        {TRAINING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </CompactSelect>
                    </Field>
                    <Field label="Language">
                      <CompactSelect value={entry.trainingLanguageId} onChange={(e) => setField('trainingLanguageId', e.target.value)}>
                        <option value="">Select language</option>
                        {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </CompactSelect>
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors"
                  >
                    + Add to list
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right column: staged list ──
              Full width and non-sticky below lg (stacks under the form);
              becomes a fixed-width sticky sidebar at lg and up, where
              there's enough horizontal room for it alongside the form. */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <StepBadge n={3} active={staged.length > 0} done={false} />
                  <span className="text-sm font-semibold text-gray-800">Pending save</span>
                </div>
                {staged.length > 0 && (
                  <span className="text-xs font-bold text-brand bg-brand/10 rounded-full px-2 py-0.5">
                    {staged.length}
                  </span>
                )}
              </div>

              {/* Feedback messages inside the panel */}
              {(saveError || successMessage) && (
                <div className="px-4 pt-3">
                  {saveError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                      {saveError}
                    </div>
                  )}
                  {successMessage && (
                    <div className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-2">
                      {successMessage}
                    </div>
                  )}
                </div>
              )}

              {/* List */}
              <div className="min-h-[100px] max-h-[280px] lg:max-h-[400px] overflow-y-auto">
                {staged.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <span className="text-3xl mb-2 opacity-30">📋</span>
                    <p className="text-xs text-gray-400">
                      Disciples you add will appear here. Save when ready.
                    </p>
                  </div>
                ) : (
                  staged.map((e, i) => (
                    <StagedRow key={i} entry={e} index={i} onRemove={removeFromStaged} />
                  ))
                )}
              </div>

              {/* Save progress */}
              {isSaving && saveProgress && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Saving…</span>
                    <span>{saveProgress.done} / {saveProgress.total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-200"
                      style={{ width: `${(saveProgress.done / saveProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Save button */}
              <div className="p-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  disabled={staged.length === 0 || isSaving || !locationLocked}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white
                             hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving
                    ? `Saving ${saveProgress?.done ?? 0}/${saveProgress?.total ?? staged.length}…`
                    : `Save ${staged.length > 0 ? staged.length : ''} disciple${staged.length === 1 ? '' : 's'}`}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  After saving you can keep adding more
                </p>
              </div>
            </div>

            {/* Session total */}
            {totalSaved > 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-teal-600">{totalSaved}</span> disciples saved this session
                </p>
              </div> 
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}