import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getStoredToken, setStoredToken } from '../api/client';
import * as authApi from '../api/auth';
import { onSessionExpired } from '../utils/sessionEvents';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true: on first load we don't yet know if a stored token is
  // still valid, so every consumer should treat this as "still checking"
  // rather than flashing a login screen before we've had a chance to ask.
  const [isLoading, setIsLoading] = useState(true);

  // Drives the in-place "session ended" overlay. Deliberately kept SEPARATE
  // from `user` -- while sessionExpired is true, `user` stays populated so
  // ProtectedRoute does NOT redirect out from under the person. The page
  // they were on stays visible (frozen, behind the overlay's blurred
  // backdrop) until they click "Log in" or the auto-redirect timer fires.
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState(null); // 'expired' | 'idle'

  // Guards against double-triggering (e.g. two requests both 401 at once).
  const sessionExpiredRef = useRef(false);

  const loadCurrentUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      // Token was invalid/expired -- the api client's response interceptor
      // already cleared it from storage, so just reflect that here.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Called by: (a) the axios 401 interceptor via the session-expired event,
  // and (b) ProtectedRoute's idle timer. Both funnel through this single
  // function so there's one source of truth for "show the overlay now."
  const triggerSessionExpired = useCallback((reason) => {
    if (sessionExpiredRef.current) return; // already showing -- don't reset the clock
    sessionExpiredRef.current = true;
    setStoredToken(null); // token is already gone/invalid either way
    setSessionExpiredReason(reason);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    return onSessionExpired((reason) => triggerSessionExpired(reason));
  }, [triggerSessionExpired]);

  // Called once the person clicks "Log in" on the overlay, or its
  // auto-redirect timer elapses. This is the point where we actually clear
  // the user and the overlay flag -- the caller navigates to /login right
  // after calling this.
  const completeSessionExpiry = useCallback(() => {
    setUser(null);
    setSessionExpired(false);
    setSessionExpiredReason(null);
    sessionExpiredRef.current = false;
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await authApi.login(email, password);
    setStoredToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setSessionExpired(false);
    setSessionExpiredReason(null);
    sessionExpiredRef.current = false;
  }, []);

  // Lets a page (e.g. ChangePassword, CompleteProfile) update specific
  // fields on the in-memory user without a full re-fetch from the server,
  // so the UI reacts immediately after a successful action.
  const patchUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  // Lightweight re-sync of just this user's permissions/role from the
  // server. Deliberately does NOT touch `isLoading` (unlike loadCurrentUser
  // above) -- toggling isLoading here would make ProtectedRoute briefly
  // render nothing on every page, which would flash the whole app blank on
  // every navigation. This is what lets a super_admin change something in
  // Roles & Permissions and have it show up for the affected user the next
  // time they load a page, without logging out.
  const refreshPermissions = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      // If the token is actually invalid, the axios interceptor already
      // handles that (clears storage + fires the session-expired event) --
      // nothing extra to do here.
    }
  }, []);

  // Flat array of permission names the current user's role has been
  // granted, e.g. ["disciple.view", "disciple.create", "report.generate"].
  // Comes straight from the server (see auth.controller.ts's `me`/`login`)
  // so it always reflects the real, current state of Roles & Permissions.
  const permissions = user?.permissions || [];

  const hasPermission = useCallback(
    (permissionName) => permissions.includes(permissionName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    patchUser,
    refreshUser: loadCurrentUser,
    refreshPermissions,
    permissions,
    hasPermission,
    sessionExpired,
    sessionExpiredReason,
    triggerSessionExpired,
    completeSessionExpiry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}