import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { ErrorBanner } from '../components/Banners';
import { useAuth } from '../context/AuthContext';
import * as disciplesApi from '../api/disciples';
import * as lookupsApi from '../api/lookups';
import { exportDisciplesToPdf, exportDisciplesToExcel } from '../utils/reportExport';

function StatPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-brand-pale text-brand border-brand/15">
      <span className="font-black text-sm">{value}</span>
      {label}
    </span>
  );
}

// Small toolbar button used for the two export actions.
function ExportButton({ onClick, disabled, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-brand/25 text-brand
                 hover:bg-brand-pale transition-all whitespace-nowrap flex items-center gap-2
                 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
      {children}
    </button>
  );
}

export function ReportsPage() {
  const { user } = useAuth();

  // Site-scoped roles (leader, teacher, or any other non-admin role) are
  // already locked to one site on the backend -- see getSiteScope() in
  // disciple.controller.ts. For them the report needs no location filter
  // at all, just a name search, so the center/site pickers below are
  // hidden entirely rather than shown-but-disabled.
  const lockedSite = user?.site || null;

  const [disciples, setDisciples] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sites, setSites] = useState([]);

  const [search, setSearch] = useState('');
  const [centerId, setCenterId] = useState('');
  const [siteId, setSiteId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Full center list, and the full site list (or just this center's
  // sites once one is picked) -- loaded once for admin/super_admin only.
  useEffect(() => {
    if (lockedSite) return;
    lookupsApi.fetchCenters().then(setCenters).catch(() => {});
  }, [lockedSite]);

  useEffect(() => {
    if (lockedSite) return;
    // No continent/country cascade here on purpose -- centerId is the
    // only thing that narrows the site list; leaving it blank returns
    // every site across every center.
    lookupsApi.fetchSites(centerId || undefined).then(setSites).catch(() => {});
  }, [centerId, lockedSite]);

  const loadDisciples = useCallback(async () => {
    setError('');
    try {
      const data = await disciplesApi.listDisciples({
        search: search || undefined,
        centerId: lockedSite ? undefined : centerId || undefined,
        siteId: lockedSite ? undefined : siteId || undefined,
      });
      setDisciples(data);
    } catch {
      setError('Could not load the report. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [search, centerId, siteId, lockedSite]);

  useEffect(() => {
    const timer = setTimeout(loadDisciples, 300);
    return () => clearTimeout(timer);
  }, [loadDisciples]);

  function latestTraining(disciple) {
    if (!disciple.trainings?.length) return null;
    return [...disciple.trainings].sort((a, b) => b.graduationYear - a.graduationYear)[0];
  }

  function buildFilterSummary() {
    if (lockedSite) {
      const label = [lockedSite.centerName, lockedSite.name].filter(Boolean).join(' — ') || lockedSite.name;
      return `Site: ${label}${search ? ` · Search: "${search}"` : ''}`;
    }
    const parts = [];
    const centerName = centers.find((c) => String(c.id) === String(centerId))?.name;
    const siteName = sites.find((s) => String(s.id) === String(siteId))?.name;
    if (centerName) parts.push(`Center: ${centerName}`);
    if (siteName) parts.push(`Site: ${siteName}`);
    if (search) parts.push(`Search: "${search}"`);
    return parts.length ? parts.join(' · ') : 'All disciples';
  }

  function generatedByLabel() {
    if (!user) return 'Unknown';
    return `${user.fullName || user.email}${user.role ? ` (${user.role})` : ''}`;
  }

  function handleExportPdf() {
    exportDisciplesToPdf({
      disciples,
      filterSummary: buildFilterSummary(),
      generatedBy: generatedByLabel(),
    });
  }

  function handleExportExcel() {
    exportDisciplesToExcel({
      disciples,
      filterSummary: buildFilterSummary(),
      generatedBy: generatedByLabel(),
    });
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Disciples report</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <StatPill label="disciples" value={disciples.length} />
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          <ExportButton
            onClick={handleExportExcel}
            disabled={isLoading || disciples.length === 0}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="19" />
                <line x1="15" y1="13" x2="9" y2="19" />
              </svg>
            }
          >
            Export Excel
          </ExportButton>
          <ExportButton
            onClick={handleExportPdf}
            disabled={isLoading || disciples.length === 0}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            }
          >
            Print / PDF
          </ExportButton>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="15" height="15"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
          // Leaders (and any other site-scoped role) already see only
          // their own site's disciples -- nothing left to filter, so we
          // just tell them what they're looking at.
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 whitespace-nowrap">
            Showing: {[lockedSite.centerName, lockedSite.name].filter(Boolean).join(' — ') || lockedSite.name}
          </span>
        ) : (
          <>
            <select
              value={centerId}
              onChange={(e) => {
                // Changing the center always resets the site picker --
                // the previously chosen site almost certainly belongs to
                // a different center, so keeping it selected could
                // silently report on a mismatched pair.
                setCenterId(e.target.value);
                setSiteId('');
              }}
              className="flex-1 min-w-[140px] sm:flex-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="">All centers</option>
              {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="flex-1 min-w-[140px] sm:flex-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="">All sites</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {/* Results */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid #D6E8F7', boxShadow: '0 2px 8px rgba(10,94,176,0.05)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            Loading…
          </div>
        ) : disciples.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-pale flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A5EB0" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">No disciples found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F4F9FE', borderBottom: '1px solid #D6E8F7' }} className="text-left">
                  {['Full name', 'Center', 'Site', 'Grad. year', 'Mode'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disciples.map((disciple) => {
                  const training = latestTraining(disciple);
                  return (
                    <tr key={disciple.id} className="border-b border-gray-50 last:border-0">
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
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{disciple.trainingSite?.center?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{disciple.trainingSite?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        {training?.graduationYear ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-pale text-brand whitespace-nowrap">
                            {training.graduationYear}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{training?.trainingMode || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}