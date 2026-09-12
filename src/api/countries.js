// Uses the `world-countries` npm package — a maintained, offline dataset
// of every country (the same underlying data restcountries.com is built
// from). Bundled locally, so there's no network request and therefore no
// CORS/downtime risk like calling a public API directly from the browser.
import countriesData from 'world-countries';

// Same continent split as before: REST-style data groups the Americas
// into one region with subregions, so we split it back into North/South
// America to match how this app's Continent table is organized.
function mapToOurContinent(region, subregion) {
  if (region === 'Africa') return 'Africa';
  if (region === 'Asia') return 'Asia';
  if (region === 'Europe') return 'Europe';
  if (region === 'Oceania') return 'Oceania';
  if (region === 'Americas') {
    return subregion === 'South America' ? 'South America' : 'North America';
  }
  return null; // e.g. Antarctic — not relevant for this app
}

// Built once, synchronously, at module load — cheap, since it's just
// grouping an already-in-memory array, no I/O involved.
const COUNTRIES_BY_CONTINENT = (() => {
  const grouped = {
    Africa: [],
    Asia: [],
    Europe: [],
    'North America': [],
    'South America': [],
    Oceania: [],
  };

  for (const entry of countriesData) {
    const continent = mapToOurContinent(entry.region, entry.subregion);
    if (!continent) continue;
    const name = entry.name?.common;
    if (!name) continue;
    grouped[continent].push(name);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = [...new Set(grouped[key])].sort((a, b) => a.localeCompare(b));
  }

  return grouped;
})();

// Kept as async functions returning Promises so the calling code
// (AddCountryModal, which does `.then()` / awaits these) doesn't need
// any changes — even though the data is actually available instantly.
export async function getCountriesByContinent() {
  return COUNTRIES_BY_CONTINENT;
}

export async function getCountriesForContinent(continentName) {
  return COUNTRIES_BY_CONTINENT[continentName] || [];
}