import axios from 'axios';

// CRA only exposes env vars prefixed with REACT_APP_ to the browser bundle --
// anything else (like a plain API_URL) is silently undefined at runtime.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

const TOKEN_STORAGE_KEY = 'bcc_token';
const SESSION_MESSAGE_KEY = 'bcc_session_message';
 
// sessionStorage (not localStorage) is deliberate: it is scoped to a single
// tab and is cleared when that tab is closed. This means pasting the app's
// URL into a new tab, a new window, or a different browser will NOT carry
// the session over -- the user lands on /login there, even though they're
// still "logged in" in the original tab.
export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * Stores the reason a session ended (idle timeout vs. a rejected/expired
 * token) so LoginPage can show the right banner right after the redirect
 * that follows. Stored as JSON -- rather than a raw string -- so we keep
 * both a machine-readable `reason` ('idle' | 'expired') and the exact
 * human-readable `message` to display, in one place.
 *
 * This is the single function BOTH the idle timer (ProtectedRoute) and
 * this file's own 401 interceptor call -- previously each wrote a plain
 * string to this same key independently, and nothing ever read it back.
 */
export function setSessionEndedMessage(reason, message) {
  sessionStorage.setItem(SESSION_MESSAGE_KEY, JSON.stringify({ reason, message }));
}

/**
 * Reads AND clears the stored session-ended message. Clearing on read is
 * deliberate: the banner should appear exactly once, immediately after the
 * redirect that caused it -- not resurface on some later, unrelated visit
 * to /login (e.g. after the user closes the banner, refreshes, or logs
 * back in a second time later).
 */
export function consumeSessionEndedMessage() {
  const raw = sessionStorage.getItem(SESSION_MESSAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(SESSION_MESSAGE_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    // Defensive fallback, in case an old plain-string value from before
    // this change is still sitting in a user's open tab.
    return { reason: 'expired', message: raw };
  }
}

// Attaches the JWT to every outgoing request automatically, so individual
// components never have to remember to add the Authorization header
// themselves.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever responds 401 (expired/invalid token, or the user
// was deactivated -- see requireAuth's re-fetch-on-every-request design),
// clear the stored token and leave a message for the login page to show,
// so the user understands *why* they were signed out instead of just
// silently landing back on /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
      setSessionEndedMessage(
        'expired',
        'Your session has expired. Please log in again.'
      );
    }
    return Promise.reject(error);
  }
);