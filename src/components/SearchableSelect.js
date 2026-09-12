import { useEffect, useRef, useState } from 'react';

// A text input that filters a list as you type.
//
// Two layout modes:
// - Default: the list has a fixed max-height and sits normally in the
//   page flow (good for short/simple forms).
// - fillHeight=true: the whole component becomes a flex column that
//   fills its parent's height, with the input pinned at the top and
//   the list stretching to fill the rest via flex-1 + its own
//   overflow-y-auto. Use this when a parent container has ONE fixed
//   height and you want only the list to scroll inside it (avoids the
//   "double scrollbar" problem of nesting two independent scroll areas).
export function SearchableSelect({
  label, 
  value,
  onChange,
  options,
  placeholder = 'Search…',
  required,
  disabled,
  autoFocus,
  emptyMessage = 'No matches',
  listHeight = 288,
  fillHeight = false,
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filtered = query.trim() === ''
    ? options
    : options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  function selectOption(option) {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={fillHeight ? 'flex flex-col h-full' : 'mb-4'}
    >
      <div className={fillHeight ? 'flex-shrink-0' : ''}>
        {label && (
          <span className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        )}
        <input
          type="text"
          value={query}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value !== value) onChange('');
          }}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand
                     placeholder:text-gray-300 transition-all bg-gray-50 hover:bg-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {isOpen && !disabled && (
        <div
          className={
            fillHeight
              ? 'mt-2 flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 bg-white'
              : 'mt-2 overflow-y-auto rounded-xl border border-gray-200 bg-white'
          }
          style={fillHeight ? undefined : { maxHeight: listHeight }}
        >
          {filtered.length === 0 ? (
            <p className="px-3.5 py-2.5 text-sm text-gray-400">{emptyMessage}</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  option === value
                    ? 'bg-brand-pale text-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}