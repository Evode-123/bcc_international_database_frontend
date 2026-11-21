import { useEffect } from 'react';

// When a dropdown has exactly ONE option -- which is normal for overseers,
// because the backend only returns the continents/countries/centers inside
// their own area -- pick it automatically so they don't have to click
// through a list of one.
//
//   useAutoSelectSingle(continents, continentId, setContinentId);
//
// Only fires while nothing is selected, so it never overrides a choice.
export function useAutoSelectSingle(options, value, onSelect) {
  useEffect(() => {
    if (!value && Array.isArray(options) && options.length === 1) {
      onSelect(String(options[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, value]);
}