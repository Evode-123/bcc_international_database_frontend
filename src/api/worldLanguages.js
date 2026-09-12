// Uses the `langs` npm package — a maintained, offline dataset covering
// the full ISO 639-3 language list (several thousand languages, not just
// the ~184 major ones in the smaller ISO 639-1 standard). That matters
// here since BCC trains in local languages a shorter "world languages"
// list would likely miss. Bundled locally, so there's no network request
// and therefore no CORS/downtime risk like calling a public API directly
// from the browser -- same reasoning as api/countries.js's use of
// world-countries.
import langs from 'langs';

// Built once, synchronously, at module load — cheap, since it's just
// mapping an already-in-memory array, no I/O involved. De-duplicated
// (a few entries share a display name) and sorted, same as the countries
// list.
const ALL_LANGUAGE_NAMES = [...new Set(langs.all().map((l) => l.name).filter(Boolean))].sort(
  (a, b) => a.localeCompare(b)
);

// Kept as an async function so the calling code (AddLanguageModal, which
// does `.then()` / awaits this) matches the exact same pattern as
// getCountriesForContinent in api/countries.js — even though the data is
// actually available instantly.
export async function getAllLanguageNames() {
  return ALL_LANGUAGE_NAMES;
}