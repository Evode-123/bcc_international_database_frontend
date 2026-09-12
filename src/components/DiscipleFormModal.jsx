import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Select } from './Select';
import { Button } from './Button';
import { ErrorBanner } from './Banners';
import { useAuth } from '../context/AuthContext';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';

const GENDERS = ['Male', 'Female'];
const TRAINING_MODES = ['Online', 'In-person'];

// Computes a whole-number age from a 'YYYY-MM-DD' date-of-birth string,
// purely for the little "Age: NN years" hint under the date picker.
// Age itself is never stored -- it's derived on the fly so it's never
// stale.
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

function emptyForm() {
  return {
    familyName: '',
    otherNames: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    city: '',
    fellowshipChurch: '',
    trainingSiteId: '',
    training: {
      id: undefined,
      graduationYear: new Date().getFullYear(),
      trainingMode: '',
      trainingLanguageId: '',
    },
  };
}

// Step indicator inside the modal
function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {[1, 2].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === n
                ? 'bg-brand text-white'
                : step > n
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {step > n ? '✓' : n}
          </div>
          <span className={`text-xs font-medium ${step === n ? 'text-brand' : 'text-gray-400'}`}>
            {n === 1 ? 'Personal details' : 'Training details'}
          </span>
          {n < 2 && <span className="text-gray-200 ml-1">—</span>}
        </div>
      ))}
    </div>
  );
}

export function DiscipleFormModal({ discipleId, onClose, onSaved }) {
  const isEditMode = !!discipleId;
  const { user } = useAuth();

  // Non-null only for site-scoped roles (teacher, leader, or any other
  // non-admin role) -- see auth.controller.ts's shapeSiteInfo. When set,
  // this disciple is always created/edited under this exact site and the
  // continent→country→center→site cascade below is replaced with a
  // read-only summary, matching what the backend enforces server-side
  // regardless of what this form sends.
  const lockedSite = user?.site || null;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDisciple, setIsLoadingDisciple] = useState(isEditMode);

  const [continents, setContinents] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [discipleContinentId, setDiscipleContinentId] = useState('');
  const [discipleCountryId, setDiscipleCountryId] = useState('');
  const [discipleCenterId, setDiscipleCenterId] = useState('');
  const [discipleCountries, setDiscipleCountries] = useState([]);
  const [discipleCenters, setDiscipleCenters] = useState([]);
  const [discipleSites, setDiscipleSites] = useState([]);

  // Load shared reference data once on mount. Site-scoped users never see
  // the continent/country/center cascade, so there's no need to fetch it
  // for them.
  useEffect(() => {
    if (!lockedSite) {
      lookupsApi.fetchContinents().then(setContinents).catch(() => {});
    }
    lookupsApi.fetchLanguages().then(setLanguages).catch(() => {});
  }, [lockedSite]);

  // Site-scoped users always create disciples under their own site --
  // pre-fill it immediately so step 1's validation passes without ever
  // showing them a location picker. The backend enforces this same site
  // independently, so this is purely about not showing a pointless cascade.
  useEffect(() => {
    if (lockedSite && !isEditMode) {
      set('trainingSiteId', String(lockedSite.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedSite, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    disciplesApi.getDisciple(discipleId).then((d) => {
      const latestTraining =
        d.trainings?.length > 0
          ? [...d.trainings].sort((a, b) => b.graduationYear - a.graduationYear)[0]
          : null;

      setForm({
        familyName: d.familyName || '',
        otherNames: d.otherNames || '',
        gender: d.gender || '',
        dateOfBirth: d.dateOfBirth || '',
        phoneNumber: d.phoneNumber || '',
        email: d.email || '',
        city: d.city || '',
        fellowshipChurch: d.fellowshipChurch || '',
        trainingSiteId: d.trainingSiteId ? String(d.trainingSiteId) : '',
        training: {
          // Track which exact Training row this is, so saving updates
          // THIS row rather than the backend having to guess.
          id: latestTraining?.id,
          graduationYear: latestTraining?.graduationYear || new Date().getFullYear(),
          trainingMode: latestTraining?.trainingMode || '',
          trainingLanguageId: latestTraining?.trainingLanguageId
            ? String(latestTraining.trainingLanguageId)
            : '',
        },
      });

      // Pre-populate the cascade so the dropdowns show the right values.
      // The fetch-only effects below don't clear sibling/child fields,
      // so setting continent/country/center together here is safe.
      // Skipped entirely for site-scoped users, who never see this
      // cascade -- their site is fixed and shown as read-only text
      // instead (see the render section below).
      if (!lockedSite) {
        const site = d.trainingSite;
        const center = site?.center;
        const country = center?.country;
        if (country?.continentId) setDiscipleContinentId(String(country.continentId));
        if (country?.id) setDiscipleCountryId(String(country.id));
        if (center?.id) setDiscipleCenterId(String(center.id));
      }
    })
    .catch(() => setError('Could not load this disciple.'))
    .finally(() => setIsLoadingDisciple(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipleId, isEditMode]);

  // ── Fetch-only cascades ─────────────────────────────────────────────
  // These effects ONLY fetch the option list for the next dropdown down
  // the chain. They deliberately do NOT clear any other field's value --
  // clearing child selections only happens in the onChange handlers
  // below, i.e. only when the person changes a dropdown themselves.
  useEffect(() => {
    if (!discipleContinentId) {
      setDiscipleCountries([]);
      return;
    }
    lookupsApi.fetchCountries(discipleContinentId).then(setDiscipleCountries).catch(() => {});
  }, [discipleContinentId]);

  useEffect(() => {
    if (!discipleCountryId) {
      setDiscipleCenters([]);
      return;
    }
    lookupsApi.fetchCenters(discipleCountryId).then(setDiscipleCenters).catch(() => {});
  }, [discipleCountryId]);

  useEffect(() => {
    if (!discipleCenterId) {
      setDiscipleSites([]);
      return;
    }
    lookupsApi.fetchSites(discipleCenterId).then((sites) => {
      setDiscipleSites(sites);
      if (sites.length === 1 && sites[0].isDefault) {
        set('trainingSiteId', String(sites[0].id));
      }
    }).catch(() => {});
  }, [discipleCenterId]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function setTraining(field, value) {
    setForm((prev) => ({ ...prev, training: { ...prev.training, [field]: value } }));
  }

  // ── User-driven cascade resets ──────────────────────────────────────
  function handleContinentChange(e) {
    setDiscipleContinentId(e.target.value);
    setDiscipleCountryId('');
    setDiscipleCenterId('');
    set('trainingSiteId', '');
  }
  function handleCountryChange(e) {
    setDiscipleCountryId(e.target.value);
    setDiscipleCenterId('');
    set('trainingSiteId', '');
  }
  function handleCenterChange(e) {
    setDiscipleCenterId(e.target.value);
    set('trainingSiteId', '');
  }

  function handleNext(e) {
    e.preventDefault();
    if (!form.familyName.trim()) { setError('Family name is required.'); return; }
    if (!form.trainingSiteId) { setError('Please select a country, center, and site.'); return; }
    setError('');
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.training.graduationYear) { setError('Graduation year is required.'); return; }
    setIsLoading(true);
    try {
      const payload = {
        familyName: form.familyName.trim(),
        otherNames: form.otherNames.trim() || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        fellowshipChurch: form.fellowshipChurch.trim() || undefined,
        trainingSiteId: parseInt(form.trainingSiteId, 10),
        training: {
          id: form.training.id,
          graduationYear: parseInt(form.training.graduationYear, 10),
          trainingMode: form.training.trainingMode || undefined,
          trainingLanguageId: form.training.trainingLanguageId
            ? parseInt(form.training.trainingLanguageId, 10)
            : undefined,
          trainingSiteId: parseInt(form.trainingSiteId, 10),
        },
      };
      if (isEditMode) {
        await disciplesApi.updateDisciple(discipleId, payload);
      } else {
        await disciplesApi.createDisciple(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const showSiteDropdown =
    discipleSites.length > 0 && !(discipleSites.length === 1 && discipleSites[0].isDefault);

  const ageHint = (() => {
    const age = calculateAge(form.dateOfBirth);
    return age !== null ? `Age: ${age} years` : undefined;
  })();

  if (isLoadingDisciple) {
    return (
      <Modal title={isEditMode ? 'Edit disciple' : 'Add disciple'} onClose={onClose} size="xl">
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#0A5EB0" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading…
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEditMode ? 'Edit disciple' : 'Add disciple'}
      subtitle={step === 1 ? 'Step 1 of 2 — Personal & location details' : 'Step 2 of 2 — Training details'}
      onClose={onClose}
      size="xl"
    >
      <StepDots step={step} />
      <ErrorBanner message={error} onClose={() => setError('')} />

      {step === 1 ? (
        <form onSubmit={handleNext}>
          <div className="grid grid-cols-2 gap-x-4">
            <TextInput label="Family name" value={form.familyName}
              onChange={(e) => set('familyName', e.target.value)} required autoFocus />
            <TextInput label="Other names" value={form.otherNames}
              onChange={(e) => set('otherNames', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <TextInput label="Date of birth" type="date" value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)} hint={ageHint} />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <TextInput label="Phone number" value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)} placeholder="+250 7…" />
            <TextInput label="Email" type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} placeholder="optional" />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <TextInput label="Current city" value={form.city}
              onChange={(e) => set('city', e.target.value)} placeholder="e.g. Kigali" />
            <TextInput label="Fellowship church" value={form.fellowshipChurch}
              onChange={(e) => set('fellowshipChurch', e.target.value)} placeholder="Their home church" />
          </div>

          {/* Location cascade */}
          <div className="border-t border-gray-100 pt-4 mt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Training location
            </p>
            {lockedSite ? (
              <div className="bg-brand-pale border border-brand/20 rounded-xl px-3.5 py-3 mb-4">
                <p className="text-xs text-brand-dark/80">
                  Disciples you add are always recorded under your assigned site:
                </p>
                <p className="text-sm font-medium text-brand-dark mt-0.5">
                  {[lockedSite.countryName, lockedSite.centerName, lockedSite.name]
                    .filter(Boolean)
                    .join(' — ')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4">
                  <Select label="Continent" value={discipleContinentId} onChange={handleContinentChange}>
                    <option value="">Select continent</option>
                    {continents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Select label="Country" value={discipleCountryId} disabled={!discipleContinentId}
                    onChange={handleCountryChange}>
                    <option value="">Select country</option>
                    {discipleCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
                <Select label="Center" value={discipleCenterId} disabled={!discipleCountryId}
                  onChange={handleCenterChange}>
                  <option value="">Select center</option>
                  {discipleCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                {showSiteDropdown && (
                  <Select label="Site" value={form.trainingSiteId}
                    onChange={(e) => set('trainingSiteId', e.target.value)}>
                    <option value="">Select site</option>
                    {discipleSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                )}
                {discipleCenterId && discipleSites.length === 1 && discipleSites[0].isDefault && (
                  <div className="bg-brand-pale border border-brand/20 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-brand-dark">
                    This center has no separate sites — the center itself is the training site.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <div className="w-44">
              <Button>Next: details →</Button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4">
            <TextInput label="Graduation year" type="number" value={form.training.graduationYear}
              onChange={(e) => setTraining('graduationYear', e.target.value)} required />
            <Select label="Training mode" value={form.training.trainingMode}
              onChange={(e) => setTraining('trainingMode', e.target.value)}>
              <option value="">Select mode</option>
              {TRAINING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <Select label="Training language" value={form.training.trainingLanguageId}
            onChange={(e) => setTraining('trainingLanguageId', e.target.value)}>
            <option value="">Select language</option>
            {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>

          <div className="flex justify-between gap-3 mt-2">
            <button type="button" onClick={() => { setStep(1); setError(''); }}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              ← Back
            </button>
            <div className="w-36">
              <Button isLoading={isLoading}>
                {isEditMode ? 'Save changes' : 'Add disciple'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}