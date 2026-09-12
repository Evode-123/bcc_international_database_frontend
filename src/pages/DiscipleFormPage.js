import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { TextInput } from '../components/TextInput';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/Banners';
import { useAuth } from '../context/AuthContext';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';

const GENDERS = ['Male', 'Female'];
const TRAINING_MODES = ['Online', 'In-person'];

// Computes a whole-number age from a 'YYYY-MM-DD' date-of-birth string,
// purely for the "Age: NN years" hint under the date picker. Age itself
// is never stored -- it's derived on the fly so it's never stale.
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
    // Single FK that identifies site → center → country chain
    trainingSiteId: '',
    training: {
      graduationYear: new Date().getFullYear(),
      trainingMode: '',
      trainingLanguageId: '',
    },
  };
}

export function DiscipleFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
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

  // Shared reference data
  const [continents, setContinents] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Disciple location cascade: continent → country → center → site
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

  // Site-scoped users always create/edit disciples under their own site --
  // pre-fill it immediately so step 1's validation passes without ever
  // showing them a location picker. The backend enforces this same site
  // independently, so this is purely about not showing a pointless cascade.
  useEffect(() => {
    if (lockedSite && !isEditMode) {
      set('trainingSiteId', String(lockedSite.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedSite, isEditMode]);

  // Load the existing disciple when editing
  useEffect(() => {
    if (!isEditMode) return;
    disciplesApi
      .getDisciple(id)
      .then((d) => {
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
            graduationYear: latestTraining?.graduationYear || new Date().getFullYear(),
            trainingMode: latestTraining?.trainingMode || '',
            trainingLanguageId: latestTraining?.trainingLanguageId
              ? String(latestTraining.trainingLanguageId)
              : '',
          },
        });

        // Pre-populate the cascade so the dropdowns show the right values.
        // The fetch-only effects below don't clear sibling/child fields,
        // so setting all three of these together is safe and won't wipe
        // out discipleCountryId/discipleCenterId/trainingSiteId the way
        // it used to. Skipped entirely for site-scoped users, who never
        // see this cascade -- their site is fixed and shown as read-only
        // text instead (see the render section below).
        if (!lockedSite) {
          const site = d.trainingSite;
          const center = site?.center;
          const country = center?.country;
          if (country?.continentId) setDiscipleContinentId(String(country.continentId));
          if (country?.id)          setDiscipleCountryId(String(country.id));
          if (center?.id)           setDiscipleCenterId(String(center.id));
        }
      })
      .catch(() => setError('Could not load this disciple.'))
      .finally(() => setIsLoadingDisciple(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  // ── Fetch-only cascades ─────────────────────────────────────────────
  // These only load the option list for the next dropdown down the
  // chain. They never clear a sibling/child field's *value* -- that
  // used to happen here and is what caused the edit form to reset the
  // country/center/site right after loading a disciple. Resetting
  // downstream selections now only happens in the onChange handlers
  // below, i.e. only in response to the person actually changing a
  // dropdown.
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
  // Only fire on a real user selection, so they never fight with the
  // "load existing disciple" effect above.
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
    if (!form.familyName.trim()) {
      setError('Family name is required.');
      return;
    }
    if (!form.trainingSiteId) {
      setError('Please select a country, center, and site for this disciple.');
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.training.graduationYear) {
      setError('Graduation year is required.');
      return;
    }

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
          graduationYear: parseInt(form.training.graduationYear, 10),
          trainingMode: form.training.trainingMode || undefined,
          trainingLanguageId: form.training.trainingLanguageId
            ? parseInt(form.training.trainingLanguageId, 10)
            : undefined,
          // Training always happens at the disciple's own site — no override needed
          trainingSiteId: parseInt(form.trainingSiteId, 10),
        },
      };

      if (isEditMode) {
        await disciplesApi.updateDisciple(id, payload);
      } else {
        await disciplesApi.createDisciple(payload);
      }
      navigate('/disciples');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this disciple. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Whether to show the site dropdown: hide it when the only site is the
  // default one (center = site scenario) — the site is auto-selected silently.
  const showDiscipleSiteDropdown =
    discipleSites.length > 0 && !(discipleSites.length === 1 && discipleSites[0].isDefault);

  const ageHint = (() => {
    const age = calculateAge(form.dateOfBirth);
    return age !== null ? `Age: ${age} years` : undefined;
  })();

  if (isLoadingDisciple) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit disciple' : 'Add disciple'}
          </h1>
          <button
            onClick={() => navigate('/disciples')}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Step {step} of 2 — {step === 1 ? 'personal details' : 'training details'}
        </p>

        <ErrorBanner message={error} />

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === 1 ? (
            <form onSubmit={handleNext}>
              {/* Personal details */}
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Family name"
                  value={form.familyName}
                  onChange={(e) => set('familyName', e.target.value)}
                  required
                  autoFocus
                />
                <TextInput
                  label="Other names"
                  value={form.otherNames}
                  onChange={(e) => set('otherNames', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
                <TextInput
                  label="Date of birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                  hint={ageHint}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Phone number"
                  value={form.phoneNumber}
                  onChange={(e) => set('phoneNumber', e.target.value)}
                  placeholder="+250 7..."
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Current city"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Kigali"
                />
                <TextInput
                  label="Fellowship church"
                  value={form.fellowshipChurch}
                  onChange={(e) => set('fellowshipChurch', e.target.value)}
                  placeholder="The church they attend"
                />
              </div>

              <hr className="my-4 border-gray-100" />
              <p className="text-sm font-medium text-gray-700 mb-3">Training location</p>

              {lockedSite ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3 mb-4">
                  <p className="text-xs text-blue-800">
                    Disciples you add are always recorded under your assigned site:
                  </p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {[lockedSite.countryName, lockedSite.centerName, lockedSite.name]
                      .filter(Boolean)
                      .join(' — ')}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-3">
                    Select the country, then the center, then the site where this disciple trains.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Continent"
                      value={discipleContinentId}
                      onChange={handleContinentChange}
                    >
                      <option value="">Select continent</option>
                      {continents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select
                      label="Country"
                      value={discipleCountryId}
                      onChange={handleCountryChange}
                      disabled={!discipleContinentId}
                    >
                      <option value="">Select country</option>
                      {discipleCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>

                  <Select
                    label="Center"
                    value={discipleCenterId}
                    onChange={handleCenterChange}
                    disabled={!discipleCountryId}
                  >
                    <option value="">Select center</option>
                    {discipleCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>

                  {/* Only show site dropdown when center has multiple sites */}
                  {showDiscipleSiteDropdown && (
                    <Select
                      label="Site"
                      value={form.trainingSiteId}
                      onChange={(e) => set('trainingSiteId', e.target.value)}
                    >
                      <option value="">Select site</option>
                      {discipleSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  )}

                  {/* Confirmation when center = site (default site auto-selected) */}
                  {discipleCenterId &&
                    discipleSites.length === 1 &&
                    discipleSites[0].isDefault && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-blue-800">
                      This center has no separate sites — the center itself is the training site.
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end mt-4">
                <div className="w-44">
                  <Button>Next: training details</Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Graduation year"
                  type="number"
                  value={form.training.graduationYear}
                  onChange={(e) => setTraining('graduationYear', e.target.value)}
                  required
                />
                <Select
                  label="Training mode"
                  value={form.training.trainingMode}
                  onChange={(e) => setTraining('trainingMode', e.target.value)}
                >
                  <option value="">Select mode</option>
                  {TRAINING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </div>

              <Select
                label="Training language"
                value={form.training.trainingLanguageId}
                onChange={(e) => setTraining('trainingLanguageId', e.target.value)}
              >
                <option value="">Select language</option>
                {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  &larr; Back
                </button>
                <div className="w-36">
                  <Button isLoading={isLoading}>Save disciple</Button>
                </div>
              </div>
            </form>
          )} 
        </div>
      </div>
    </AppLayout>
  );
}