import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Modal, ConfirmModal } from '../components/Modal';
import { TextInput } from '../components/TextInput';
import { Select } from '../components/Select';
import { SearchableSelect } from '../components/SearchableSelect';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/Banners';
import * as locationsApi from '../api/locations';
import { CONTINENTS } from '../data/continents';
import { getCountriesForContinent } from '../api/countries';
import { getAllLanguageNames } from '../api/worldLanguages';

// ── Shared name-edit modal (still free text — used for renaming an
//    already-chosen continent/country, and for site add/edit, since site
//    names are your own org's names, not a fixed real-world list) ─────────

function NameModal({ title, subtitle, initialName = '', onClose, onSubmit }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    setIsLoading(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} size="sm">
      <ErrorBanner message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <div className="w-28"><Button isLoading={isLoading}>Save</Button></div>
        </div>
      </form>
    </Modal>
  );
}

// ── Add-continent modal — dropdown of the fixed 6 continents, minus any
//    already added, so it's literally impossible to add a duplicate or
//    a typo'd continent name ──────────────────────────────────────────────

function AddContinentModal({ existingNames, onClose, onSaved }) {
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingSet = new Set(existingNames);
  const available = CONTINENTS.filter((c) => !existingSet.has(c));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selected) { setError('Please select a continent.'); return; }
    setIsLoading(true);
    try {
      await locationsApi.createContinent(selected);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Add continent" onClose={onClose} size="sm">
      <ErrorBanner message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <Select label="Continent" value={selected} onChange={(e) => setSelected(e.target.value)} required>
          <option value="">Select continent</option>
          {available.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        {available.length === 0 && (
          <p className="text-xs text-gray-400 mb-4">All continents have already been added.</p>
        )}
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <div className="w-28">
            <Button isLoading={isLoading} disabled={!selected}>Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Add-country modal — searchable dropdown of real countries for the
//    chosen continent (fetched from REST Countries), minus any already
//    added under that continent ────────────────────────────────────────

function AddCountryModal({ continentId, continentName, existingNames, onClose, onSaved }) {
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getCountriesForContinent(continentName)
      .then((list) => { if (isMounted) setCountries(list); })
      .catch(() => {
        if (isMounted) setLoadError('Could not load the country list. Check your connection and try again.');
      })
      .finally(() => { if (isMounted) setIsLoadingCountries(false); });
    return () => { isMounted = false; };
  }, [continentName]);

  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
  const availableCountries = countries.filter((c) => !existingSet.has(c.toLowerCase()));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedCountry) { setError('Please select a country.'); return; }
    setIsLoading(true);
    try {
      await locationsApi.createCountry(selectedCountry, continentId);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Add country" subtitle={`In ${continentName}`} onClose={onClose} size="lg">
      {isLoadingCountries ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 gap-2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading countries…
        </div>
      ) : loadError ? (
        <ErrorBanner message={loadError} />
      ) : (
        // Fixed-height flex column: this is what gives us ONE scrollbar
        // instead of two. The Modal body itself never needs to scroll
        // because this whole block fits within a set height — only the
        // list inside SearchableSelect (fillHeight mode) scrolls.
        <form
          onSubmit={handleSubmit}
          className="flex flex-col"
          style={{ height: '58vh', maxHeight: 480 }}
        >
          {error && (
            <div className="mb-3 flex-shrink-0">
              <ErrorBanner message={error} onClose={() => setError('')} />
            </div>
          )}

          <div className="flex-1 min-h-0">
            <SearchableSelect
              label="Country"
              value={selectedCountry}
              onChange={setSelectedCountry}
              options={availableCountries}
              placeholder="Type to search, or scroll to browse…"
              required
              autoFocus
              fillHeight
              emptyMessage={
                availableCountries.length === 0
                  ? 'All countries in this continent have already been added.'
                  : 'No matches'
              }
            />
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancel
            </button>
            <div className="w-28">
              <Button isLoading={isLoading} disabled={!selectedCountry}>Save</Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Add-center modal (unchanged — center names are your own org's) ───────

function AddCenterModal({ countryId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [hasSites, setHasSites] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (hasSites === null) { setError('Please choose whether this center has separate sites.'); return; }
    setIsLoading(true);
    try {
      await locationsApi.createCenter(name.trim(), countryId, hasSites);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Add center" onClose={onClose} size="md">
      <ErrorBanner message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit}>
        <TextInput label="Center name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ERC, AUCA" required autoFocus />

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Does this center have separate training sites?
          </p>
          <div className="space-y-2.5">
            {[
              {
                value: false,
                title: 'No — the center itself is the training site',
                desc: 'A default site named after the center will be created automatically.',
              },
              {
                value: true,
                title: 'Yes — this center has multiple training sites',
                desc: 'You will add sites manually after saving the center.',
              },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                  hasSites === opt.value
                    ? 'border-brand bg-brand-pale'
                    : 'border-gray-200 hover:border-brand/40'
                }`}
              >
                <input type="radio" name="hasSites" checked={hasSites === opt.value}
                  onChange={() => setHasSites(opt.value)} className="mt-0.5 accent-brand" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{opt.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <div className="w-28"><Button isLoading={isLoading}>Save</Button></div>
        </div>
      </form>
    </Modal>
  );
}

// ── Add-language modal (unchanged) ────────────────────────────────────────

// Add-language modal — searchable dropdown of real, existing languages
// (from the `langs` dataset), minus any already added. Mirrors
// AddCountryModal above: same fixed-height flex layout so there's ONE
// scrollbar (inside the list) instead of two, and the same "type to
// search or scroll to browse" pattern.
function AddLanguageModal({ existingNames, onClose, onSaved }) {
  const [allLanguages, setAllLanguages] = useState([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getAllLanguageNames()
      .then((list) => { if (isMounted) setAllLanguages(list); })
      .catch(() => {
        if (isMounted) setLoadError('Could not load the language list. Check your connection and try again.');
      })
      .finally(() => { if (isMounted) setIsLoadingLanguages(false); });
    return () => { isMounted = false; };
  }, []);

  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
  const availableLanguages = allLanguages.filter((l) => !existingSet.has(l.toLowerCase()));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!selectedLanguage) { setError('Please select a language.'); return; }
    setIsLoading(true);
    try {
      await locationsApi.createLanguage(selectedLanguage);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title="Add training language" onClose={onClose} size="lg">
      {isLoadingLanguages ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 gap-2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading languages…
        </div>
      ) : loadError ? (
        <ErrorBanner message={loadError} />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col"
          style={{ height: '58vh', maxHeight: 480 }}
        >
          {error && (
            <div className="mb-3 flex-shrink-0">
              <ErrorBanner message={error} onClose={() => setError('')} />
            </div>
          )}

          <div className="flex-1 min-h-0">
            <SearchableSelect
              label="Language"
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              options={availableLanguages}
              placeholder="Type to search, or scroll to browse…"
              required
              autoFocus
              fillHeight
              emptyMessage={
                availableLanguages.length === 0
                  ? 'All languages have already been added.'
                  : 'No matches'
              }
            />
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancel
            </button>
            <div className="w-28">
              <Button isLoading={isLoading} disabled={!selectedLanguage}>Save</Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Chevron / Action btn ──────────────────────────────────────────────────

const Chevron = ({ open }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform flex-shrink-0 text-gray-400 ${open ? 'rotate-90' : ''}`}
  >
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

function ActionBtn({ onClick, color = 'gray', children }) {
  const styles = {
    gray: 'text-gray-500 hover:text-brand hover:bg-brand-pale',
    red: 'text-red-500 hover:text-white hover:bg-red-500',
    blue: 'text-brand hover:bg-brand hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${styles[color]}`}
      type="button"
    >
      {children}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function ManageLocationsPage() {
  const [continents, setContinents] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedCountries, setExpandedCountries] = useState(new Set());
  const [expandedCenters, setExpandedCenters] = useState(new Set());

  // Modal state
  const [addContinentModal, setAddContinentModal] = useState(false);
  const [addCountryModal, setAddCountryModal] = useState(null); // { continentId, continentName, existingNames }
  const [nameModal, setNameModal]           = useState(null);   // edit continent/country, add/edit site
  const [addCenterModal, setAddCenterModal] = useState(null);
  const [editCenterModal, setEditCenterModal] = useState(null);
  const [addLanguageModal, setAddLanguageModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { label, onConfirm }
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await locationsApi.fetchLocationsTree();
      setContinents(data.continents);
      setLanguages(data.languages);
    } catch {
      setError('Could not load locations. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleSet(setFn, id) {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Generic delete flow — opens confirm modal, runs deleteFn on confirm
  function promptDelete(label, deleteFn) {
    setConfirmDelete({ label, deleteFn });
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await confirmDelete.deleteFn();
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || `Could not delete this ${confirmDelete.label}.`);
      setConfirmDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // NameModal is now only reached for: editing a continent/country name,
  // and adding/editing a site (all still free text — see comment above
  // NameModal's definition for why).
  async function handleNameModalSave(name) {
    const { mode, level, parentId, item } = nameModal;
    if (mode === 'add') {
      if (level === 'site') await locationsApi.createSite(name, parentId);
    } else {
      if (level === 'continent') await locationsApi.updateContinent(item.id, name);
      if (level === 'country')   await locationsApi.updateCountry(item.id, { name });
      if (level === 'site')      await locationsApi.updateSite(item.id, name);
    }
    setNameModal(null);
    await load();
  }

  async function handleEditCenterSave(name) {
    await locationsApi.updateCenter(editCenterModal.center.id, { name });
    setEditCenterModal(null);
    await load();
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-sm text-gray-400 gap-2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading…
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage locations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Continents, countries, centers, and sites used when adding disciples
          </p>
        </div>
        <div className="w-36">
          <Button variant="secondary" type="button" onClick={() => setAddContinentModal(true)}>
            + Continent
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Locations tree */}
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        {continents.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-gray-500">No continents yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a continent to get started</p>
          </div>
        )}

        {continents.map((continent) => (
          <div key={continent.id} className="border-b border-gray-100 last:border-0">

            {/* Continent row */}
            <div
              className="flex items-center justify-between py-3 px-5"
              style={{ background: '#F4F9FE' }}
            >
              <span className="font-bold text-sm text-gray-900">{continent.name}</span>
              <div className="flex items-center gap-1">
                <ActionBtn
                  onClick={() => setAddCountryModal({
                    continentId: continent.id,
                    continentName: continent.name,
                    existingNames: continent.countries.map((c) => c.name),
                  })}
                >
                  + Country
                </ActionBtn>
                <ActionBtn onClick={() => setNameModal({ mode: 'edit', level: 'continent', item: continent })}>
                  Edit
                </ActionBtn>
                <ActionBtn color="red"
                  onClick={() => promptDelete('continent', () => locationsApi.deleteContinent(continent.id))}>
                  Delete
                </ActionBtn>
              </div>
            </div>

            {/* Countries */}
            <div className="pl-5">
              {continent.countries.map((country) => {
                const isOpen = expandedCountries.has(country.id);
                return (
                  <div key={country.id} className="border-t border-gray-50">
                    <div className="flex items-center justify-between py-2.5 px-4">
                      <button
                        className="flex items-center gap-2 text-sm text-gray-700 font-medium"
                        onClick={() => toggleSet(setExpandedCountries, country.id)}
                      >
                        <Chevron open={isOpen} />
                        {country.name}
                        <span className="text-gray-400 text-xs font-normal">
                          ({country.centers.length} center{country.centers.length !== 1 ? 's' : ''})
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <ActionBtn onClick={() => setAddCenterModal({ countryId: country.id })}>+ Center</ActionBtn>
                        <ActionBtn onClick={() => setNameModal({ mode: 'edit', level: 'country', item: country })}>Edit</ActionBtn>
                        <ActionBtn color="red"
                          onClick={() => promptDelete('country', () => locationsApi.deleteCountry(country.id))}>
                          Delete
                        </ActionBtn>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="pl-6">
                        {country.centers.length === 0 && (
                          <p className="text-xs text-gray-400 py-2 px-3">No centers yet.</p>
                        )}
                        {country.centers.map((center) => {
                          const centerOpen = expandedCenters.has(center.id);
                          const isDefaultOnly = center.sites.length === 1 && center.sites[0].isDefault;
                          return (
                            <div key={center.id} className="border-t border-gray-50">
                              <div className="flex items-center justify-between py-2.5 px-4">
                                <button
                                  className="flex items-center gap-2 text-sm text-gray-600"
                                  onClick={() => toggleSet(setExpandedCenters, center.id)}
                                >
                                  <Chevron open={centerOpen} />
                                  {center.name}
                                  <span className="text-gray-400 text-xs">
                                    {isDefaultOnly ? '(center = site)' : `(${center.sites.length} site${center.sites.length !== 1 ? 's' : ''})`}
                                  </span>
                                </button>
                                <div className="flex items-center gap-1">
                                  {!isDefaultOnly && (
                                    <ActionBtn onClick={() => setNameModal({ mode: 'add', level: 'site', parentId: center.id })}>
                                      + Site
                                    </ActionBtn>
                                  )}
                                  <ActionBtn onClick={() => setEditCenterModal({ center })}>Edit</ActionBtn>
                                  <ActionBtn color="red"
                                    onClick={() => promptDelete('center', () => locationsApi.deleteCenter(center.id))}>
                                    Delete
                                  </ActionBtn>
                                </div>
                              </div>

                              {centerOpen && !isDefaultOnly && (
                                <div className="pl-6 pb-2">
                                  {center.sites.map((site) => (
                                    <div key={site.id}
                                      className="flex items-center justify-between py-2 px-4 text-sm text-gray-500 border-t border-gray-50">
                                      <span>{site.name}</span>
                                      <div className="flex items-center gap-1">
                                        <ActionBtn onClick={() => setNameModal({ mode: 'edit', level: 'site', item: site })}>Edit</ActionBtn>
                                        <ActionBtn color="red"
                                          onClick={() => promptDelete('site', () => locationsApi.deleteSite(site.id))}>
                                          Delete
                                        </ActionBtn>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {centerOpen && isDefaultOnly && (
                                <p className="pl-10 pb-2 text-xs text-gray-400 italic">
                                  This center trains directly — no separate sites.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Languages section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">Training languages</h2>
        <div className="w-36">
          <Button variant="secondary" type="button" onClick={() => setAddLanguageModal(true)}>
            + Language
          </Button>
        </div>
      </div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        {languages.length === 0 && (
          <p className="text-sm text-gray-400 px-5 py-4">No languages yet.</p>
        )}
        {languages.map((lang) => (
          <div key={lang.id}
            className="flex items-center justify-between py-3 px-5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-pale flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A5EB0" strokeWidth="2">
                  <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
                  <path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800">{lang.name}</span>
            </div>
            <ActionBtn color="red"
              onClick={() => promptDelete('language', () => locationsApi.deleteLanguage(lang.id))}>
              Delete
            </ActionBtn>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {addContinentModal && (
        <AddContinentModal
          existingNames={continents.map((c) => c.name)}
          onClose={() => setAddContinentModal(false)}
          onSaved={async () => { setAddContinentModal(false); await load(); }}
        />
      )}
      {addCountryModal && (
        <AddCountryModal
          continentId={addCountryModal.continentId}
          continentName={addCountryModal.continentName}
          existingNames={addCountryModal.existingNames}
          onClose={() => setAddCountryModal(null)}
          onSaved={async () => { setAddCountryModal(null); await load(); }}
        />
      )}
      {nameModal && (
        <NameModal
          title={`${nameModal.mode === 'add' ? 'Add' : 'Edit'} ${nameModal.level}`}
          initialName={nameModal.item?.name || ''}
          onClose={() => setNameModal(null)}
          onSubmit={handleNameModalSave}
        />
      )}
      {addCenterModal && (
        <AddCenterModal
          countryId={addCenterModal.countryId}
          onClose={() => setAddCenterModal(null)}
          onSaved={async () => { setAddCenterModal(null); await load(); }}
        />
      )}
      {editCenterModal && (
        <NameModal
          title="Edit center"
          initialName={editCenterModal.center.name}
          onClose={() => setEditCenterModal(null)}
          onSubmit={handleEditCenterSave}
        />
      )}
      {addLanguageModal && (
        <AddLanguageModal
          existingNames={languages.map((l) => l.name)}
          onClose={() => setAddLanguageModal(false)}
          onSaved={async () => { setAddLanguageModal(false); await load(); }}
        />
      )} 
      {confirmDelete && (
        <ConfirmModal
          title={`Delete this ${confirmDelete.label}?`}
          message="This action cannot be undone. Any linked records must be removed or reassigned first."
          confirmLabel="Yes, delete"
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </AppLayout>
  );
}