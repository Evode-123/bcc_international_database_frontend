import { useEffect } from 'react';

// Base modal — used for forms/content
export function Modal({ title, subtitle, onClose, children, size = 'md' }) {
  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

  return ( 
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(10,46,110,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel — capped height, flex column so the body can scroll on its own */}
      <div
        className={`relative w-full ${widths[size] ?? widths.md} rounded-2xl overflow-hidden flex flex-col`}
        style={{
          background: 'white',
          boxShadow: '0 24px 64px rgba(10,46,110,0.22)',
          maxHeight: '88vh',
        }}
      >
        {/* Header — never scrolls */}
        <div
          className="flex items-start justify-between px-6 py-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #0A2E6E 0%, #0A5EB0 100%)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-white/65 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none -mt-0.5 ml-4"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Body — this is the part that scrolls; flex-1 + min-h-0 is what
            lets it shrink to the remaining space instead of pushing the
            panel taller than the viewport. */}
        <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Confirm modal — replaces window.confirm for all delete/destructive actions
export function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(10,46,110,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'white', boxShadow: '0 24px 64px rgba(10,46,110,0.22)' }}
      >
        {/* Icon + title */}
        <div className="flex flex-col items-center text-center px-6 pt-7 pb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              isDanger ? 'bg-red-50' : 'bg-brand-pale'
            }`}
          >
            {isDanger ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#CC1111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#0A5EB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
          {message && (
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                       border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors
                        disabled:opacity-50 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}