import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { ErrorBanner, SuccessBanner } from '../components/Banners';
import { DiscipleFormModal } from '../components/DiscipleFormModal';
import { DiscipleViewModal } from '../components/DiscipleViewModal';
import { ConfirmModal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Options offered in the "rows per page" picker. 15 is the default --
// same as before this change -- so nobody's existing experience shifts
// unless they deliberately pick a different size.
const PAGE_SIZE_OPTIONS = [10, 15, 50];
const DEFAULT_PAGE_SIZE = 15;

// Page-level stat pill
function StatPill({ label, value, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-pale text-brand border-brand/15',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${colors[color]}`}>
      <span className="font-black text-sm">{value}</span>
      {label}
    </span>
  );
}

// Small icon-only action button with a native tooltip (title attribute)
function IconActionButton({ title, onClick, variant = 'gray', children }) {
  const variants = {
    gray: 'text-gray-600 bg-gray-100 hover:bg-gray-700 hover:text-white',
    brand: 'text-brand bg-brand-pale hover:bg-brand hover:text-white',
    red: 'text-red-600 bg-red-50 hover:bg-red-600 hover:text-white',
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// Pagination bar shown under the table, now with a "rows per page" picker
// alongside the Prev/Next controls.
function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageSizeChange,
  onPrev,
  onNext,
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100">
      <div className="flex items-center gap-3 order-2 sm:order-1">
        <span className="text-xs text-gray-400">
          Showing <span className="font-semibold text-gray-600">{start}–{end}</span> of{' '}
          <span className="font-semibold text-gray-600">{totalItems}</span> disciples
        </span>
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        <span className="text-xs font-semibold text-gray-500 px-1 whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export function DisciplesDirectoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission, user } = useAuth();

  // Non-null only for site-scoped roles (teacher, leader, or any other
  // non-admin role). When set, the backend already restricts every result
  // to this site, so the continent/country/center filters below (which
  // would otherwise offer to "widen" the view) are hidden entirely.
  const lockedSite = user?.site || null;

  // What this user is actually allowed to do with disciple records right
  // now. Pulled straight from Roles & Permissions via AuthContext, so if a
  // super_admin unchecks "Add disciples" for this user's role, these flip
  // to false the next time this page loads -- no other code change needed.
  const canCreate = hasPermission('disciple.create');
  const canEdit = hasPermission('disciple.edit');
  const canDelete = hasPermission('disciple.delete');

  const [disciples, setDisciples] = useState([]);
  const [continents, setContinents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [centers, setCenters] = useState([]);

  // Pre-fills from ?search=... when arriving from the topbar search bar
  // (see TopbarSearch.js), so typing a name there and hitting Enter lands
  // here with that term already applied to the filter below.
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [continentId, setContinentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [centerId, setCenterId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination — client-side, since listDisciples returns the full
  // filtered set in one response. Reset back to page 1 whenever the
  // filters OR the page size change (see effects below), so switching
  // either one never strands the user on an empty later page.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Modals
  const [viewModal, setViewModal] = useState(null); // null | { discipleId }
  const [formModal, setFormModal] = useState(null); // null | { discipleId?: number }
  const [deleteModal, setDeleteModal] = useState(null); // null | { disciple }
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!lockedSite) {
      lookupsApi.fetchContinents().then(setContinents).catch(() => {});
    }
  }, [lockedSite]);

  useEffect(() => {
    setCountryId('');
    setCountries([]);
    setCenterId('');
    setCenters([]);
    if (continentId) lookupsApi.fetchCountries(continentId).then(setCountries).catch(() => {});
  }, [continentId]);

  useEffect(() => {
    setCenterId('');
    setCenters([]);
    if (countryId) lookupsApi.fetchCenters(countryId).then(setCenters).catch(() => {});
  }, [countryId]);

  const loadDisciples = useCallback(async () => {
    setError('');
    try {
      const data = await disciplesApi.listDisciples({
        search: search || undefined,
        continentId: continentId || undefined,
        countryId: countryId || undefined,
        centerId: centerId || undefined,
      });
      setDisciples(data);
    } catch {
      setError('Could not load disciples. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [search, continentId, countryId, centerId]);

  useEffect(() => {
    const timer = setTimeout(loadDisciples, 300);
    return () => clearTimeout(timer);
  }, [loadDisciples]);

  // Any change to the search term, location filters, or page size should
  // always land back on page 1 -- otherwise a person filtering down to a
  // small result set (or switching to a larger page size) could be stuck
  // looking at a blank later page.
  useEffect(() => {
    setPage(1);
  }, [search, continentId, countryId, centerId, pageSize]);

  const totalPages = Math.max(1, Math.ceil(disciples.length / pageSize));

  // Clamp the current page if the underlying list shrinks (e.g. after a
  // delete) so we never render an out-of-range page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedDisciples = disciples.slice((page - 1) * pageSize, page * pageSize);

  async function handleDelete() {
    if (!deleteModal) return;
    const discipleName = `${deleteModal.disciple.familyName} ${deleteModal.disciple.otherNames || ''}`.trim();
    setIsDeleting(true);
    setError('');
    try {
      await disciplesApi.deleteDisciple(deleteModal.disciple.id);
      setDeleteModal(null);
      setSuccessMessage(`${discipleName} was removed from the directory.`);
      await loadDisciples();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete this disciple.');
      setDeleteModal(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function latestTraining(disciple) {
    if (!disciple.trainings?.length) return null;
    return [...disciple.trainings].sort((a, b) => b.graduationYear - a.graduationYear)[0];
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Disciples directory</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <StatPill label="disciples" value={disciples.length} />
          </div>
        </div>
        {/* Add/bulk-add actions only show for roles allowed to create
            disciples -- controlled entirely by the "Add disciples"
            checkbox in Roles & Permissions. All three sit in a single row
            (wrapping only if the viewport is too narrow to fit them). */}
        {canCreate && (
          <div className="flex flex-row flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/disciples/import')}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-brand/25
                        text-brand hover:bg-brand-pale transition-all whitespace-nowrap"
              type="button"
            >
              Import Excel
            </button>
            <button
              onClick={() => navigate('/disciples/bulk-add')}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-brand/25
                        text-brand hover:bg-brand-pale transition-all whitespace-nowrap"
              type="button"
            >
              Bulk add
            </button>
            <div className="w-auto flex-shrink-0">
              <Button onClick={() => setFormModal({})} type="button">
                + Add disciple
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-gray-50"
          />
        </div>
        {lockedSite ? (
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 whitespace-nowrap">
            Showing: {[lockedSite.centerName, lockedSite.name].filter(Boolean).join(' — ') || lockedSite.name}
          </span>
        ) : (
          [
            { label: 'All continents', value: continentId, onChange: (v) => setContinentId(v), options: continents, disabled: false },
            { label: 'All countries', value: countryId, onChange: (v) => setCountryId(v), options: countries, disabled: !continentId },
            { label: 'All centers', value: centerId, onChange: (v) => setCenterId(v), options: centers, disabled: !countryId },
          ].map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            disabled={f.disabled}
            className="flex-1 min-w-[140px] sm:flex-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          ))
        )}
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />
      <SuccessBanner message={successMessage} onClose={() => setSuccessMessage('')} />

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading…
          </div>
        ) : disciples.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-pale flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A5EB0" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">No disciples found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters{canCreate ? ' or add a new disciple' : ''}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F4F9FE', borderBottom: '1px solid #D6E8F7' }}
                    className="text-left">
                    {['Full name', 'Training location', 'Grad. year', 'Mode', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedDisciples.map((disciple) => {
                    const training = latestTraining(disciple);
                    const siteName = disciple.trainingSite?.name;
                    const centerName = disciple.trainingSite?.center?.name;
                    const locationLabel =
                      siteName && centerName && siteName !== centerName
                        ? `${centerName} — ${siteName}`
                        : centerName || siteName || '—';

                    return (
                      <tr
                        key={disciple.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-brand-pale/40 transition-colors cursor-pointer"
                        onClick={() => setViewModal({ discipleId: disciple.id })}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: `hsl(${(disciple.id * 47) % 360},55%,48%)` }}
                            >
                              {disciple.familyName[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 whitespace-nowrap">
                              {disciple.familyName} {disciple.otherNames}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{locationLabel}</td>
                        <td className="px-5 py-3.5">
                          {training?.graduationYear ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-pale text-brand whitespace-nowrap">
                              {training.graduationYear}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {training?.trainingMode || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* View is always available -- reaching this page
                                already required "disciple.view". */}
                            <IconActionButton title="View" variant="gray" onClick={() => setViewModal({ discipleId: disciple.id })}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </IconActionButton>
                            {/* Edit only shows if the role has "disciple.edit" */}
                            {canEdit && (
                              <IconActionButton title="Edit" variant="brand" onClick={() => setFormModal({ discipleId: disciple.id })}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9"/>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                </svg>
                              </IconActionButton>
                            )}
                            {/* Delete only shows if the role has "disciple.delete" */}
                            {canDelete && (
                              <IconActionButton title="Delete" variant="red" onClick={() => setDeleteModal({ disciple })}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18"/>
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  <path d="M10 11v6"/>
                                  <path d="M14 11v6"/>
                                </svg>
                              </IconActionButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              totalItems={disciples.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </div>
 
      {/* View modal */}
      {viewModal !== null && (
        <DiscipleViewModal
          discipleId={viewModal.discipleId}
          onClose={() => setViewModal(null)}
          // Only offer the "Edit disciple" button inside the view modal if
          // this role is actually allowed to edit -- otherwise omit the
          // prop entirely, which DiscipleViewModal already treats as "no
          // edit button" (see its `{onEdit && (...)}` check).
          onEdit={
            canEdit
              ? () => {
                  const discipleId = viewModal.discipleId;
                  setViewModal(null);
                  setFormModal({ discipleId });
                }
              : undefined
          }
        />
      )}

      {/* Add/Edit modal */}
      {formModal !== null && (
        <DiscipleFormModal
          discipleId={formModal.discipleId}
          onClose={() => setFormModal(null)}
          onSaved={() => {
            const wasEdit = !!formModal.discipleId;
            setFormModal(null);
            setSuccessMessage(wasEdit ? 'Changes saved successfully.' : 'Disciple added successfully.');
            loadDisciples();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <ConfirmModal
          title="Delete disciple?"
          message={`This will permanently delete ${deleteModal.disciple.familyName} ${deleteModal.disciple.otherNames || ''} and all their training history. This cannot be undone.`}
          confirmLabel="Yes, delete"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </AppLayout>
  );
}