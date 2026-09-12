import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import * as disciplesApi from '../api/disciples';

// Computes a whole-number age from a 'YYYY-MM-DD' date-of-birth string.
// Age is never stored in the database -- it's derived here on the fly
// from dateOfBirth so it's never stale (mirrors the same helper used in
// DiscipleFormModal.js).
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

// Formats a 'YYYY-MM-DD' string into something more readable, e.g.
// "12 March 1998", instead of showing the raw ISO string in the UI.
function formatDob(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return dobString;
  return dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right">
        {value === 0 ? 0 : value || '—'}
      </span>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50/60 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

/**
 * Read-only detail view for a single disciple. Fetches its own data by
 * id (rather than relying on whatever fields happen to be loaded in the
 * directory table row) so it always shows the full record -- personal
 * details, the complete training-location chain, every training/
 * graduation on file, and any repeat-attendance history.
 *
 * `onEdit` is optional: when provided, a "Edit disciple" button is shown
 * that lets the caller close this modal and open the edit modal in one
 * click, without the user needing to close and re-find the row.
 */
export function DiscipleViewModal({ discipleId, onClose, onEdit }) {
  const [disciple, setDisciple] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');
    disciplesApi
      .getDisciple(discipleId)
      .then((d) => { if (isMounted) setDisciple(d); })
      .catch(() => { if (isMounted) setError('Could not load this disciple.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [discipleId]);

  if (isLoading) {
    return (
      <Modal title="Disciple details" onClose={onClose} size="lg">
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

  if (error || !disciple) {
    return (
      <Modal title="Disciple details" onClose={onClose} size="sm">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error || 'Disciple not found.'}
        </div>
      </Modal>
    );
  }

  const site = disciple.trainingSite;
  const center = site?.center;
  const country = center?.country;
  const continent = country?.continent;

  const locationLabel = [
    continent?.name,
    country?.name,
    center?.name,
    site && site.name !== center?.name ? site.name : null,
  ]
    .filter(Boolean)
    .join(' › ');

  const sortedTrainings = disciple.trainings?.length
    ? [...disciple.trainings].sort((a, b) => b.graduationYear - a.graduationYear)
    : [];

  const initials = disciple.familyName?.[0]?.toUpperCase() || '?';
  const age = calculateAge(disciple.dateOfBirth);

  return (
    <Modal
      title="Disciple details"
      subtitle={`${disciple.familyName} ${disciple.otherNames || ''}`.trim()}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        {/* Header card */}
        <div className="flex items-center gap-4 bg-brand-pale/60 rounded-xl px-4 py-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: `hsl(${(disciple.id * 47) % 360},55%,48%)` }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              {disciple.familyName} {disciple.otherNames}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {locationLabel || 'No training location set'}
            </p>
          </div>
        </div>

        {/* Personal details */}
        <SectionCard title="Personal details">
          <InfoRow label="Gender" value={disciple.gender} />
          <InfoRow label="Date of birth" value={formatDob(disciple.dateOfBirth)} />
          <InfoRow label="Age" value={age !== null ? `${age} years` : null} />
          <InfoRow label="Phone number" value={disciple.phoneNumber} />
          <InfoRow label="Email" value={disciple.email} />
          <InfoRow label="Current city" value={disciple.city} />
          <InfoRow label="Fellowship church" value={disciple.fellowshipChurch} />
        </SectionCard>

        {/* Training location */}
        <SectionCard title="Training location">
          <InfoRow label="Continent" value={continent?.name} />
          <InfoRow label="Country" value={country?.name} />
          <InfoRow label="Center" value={center?.name} />
          <InfoRow label="Site" value={site?.name} />
        </SectionCard>

        {/* Training history */}
        <SectionCard
          title={`Training history${sortedTrainings.length ? ` (${sortedTrainings.length})` : ''}`}
        >
          {sortedTrainings.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">No training records yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedTrainings.map((t) => (
                <div key={t.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      Graduated {t.graduationYear}
                    </span>
                    {t.trainingMode && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-pale text-brand font-semibold">
                        {t.trainingMode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[t.trainingLanguage?.name, t.trainingSite?.name].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Repeat attendance history, only shown if there is any */}
        {disciple.repeatAttendances?.length > 0 && (
          <SectionCard title={`Repeat attendance (${disciple.repeatAttendances.length})`}>
            <div className="divide-y divide-gray-50">
              {disciple.repeatAttendances.map((r) => (
                <div key={r.id} className="py-2.5">
                  <p className="text-sm font-semibold text-gray-800">
                    Attended again in {r.attendanceYear}
                  </p>
                  {r.training?.graduationYear && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Originally graduated {r.training.graduationYear}
                    </p>
                  )}
                  {r.notes && <p className="text-xs text-gray-500 mt-1 italic">{r.notes}</p>}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-xl transition-colors"
            >
              Edit disciple
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}