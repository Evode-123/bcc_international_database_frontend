import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Lives in the topbar. Submitting searches the disciples directory by
// name -- the only searchable dataset in the app today -- by navigating
// to /disciples with the term in the URL. DisciplesDirectoryPage reads
// it back out on mount (see the ?search= handling added there) and
// pre-fills its own filter bar with it.
export function TopbarSearch({ className = '' }) {
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = term.trim();
    navigate(trimmed ? `/disciples?search=${encodeURIComponent(trimmed)}` : '/disciples');
  }
 
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search disciples by name…"
        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-700
                   focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white
                   placeholder:text-gray-400 transition-all"
      />
    </form>
  );
}