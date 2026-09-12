// A minimal event bridge. api/client.js (a plain axios module, not a React
// component) needs to tell AuthContext "the token just got rejected by the
// server" -- but it can't import a hook. Dispatching a real DOM CustomEvent
// on `window` is the simplest way to cross that boundary without adding a
// state-management library.
export const SESSION_EXPIRED_EVENT = 'bcc:session-expired';

// reason: 'expired' (server rejected the token, e.g. 401) | 'idle' (frontend
// inactivity timer fired)
export function emitSessionExpired(reason) {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
}
 
// Returns an unsubscribe function -- call it in a useEffect cleanup.
export function onSessionExpired(handler) {
  const listener = (e) => handler(e.detail?.reason);
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}