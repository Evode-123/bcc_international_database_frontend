export function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg> 
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
          type="button">×</button>
      )}
    </div>
  );
}

export function SuccessBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none flex-shrink-0"
          type="button">×</button>
      )}
    </div>
  );
}