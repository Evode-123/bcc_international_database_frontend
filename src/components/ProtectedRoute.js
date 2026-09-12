import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { IDLE_TIMEOUT_MS } from '../config/session';
import { setSessionEndedMessage } from '../api/client';

/**
 * Mirrors the backend's own gating order (requireAuth ->
 * blockIfMustChangePassword -> route handler) on the frontend, so a user
 * never even sees a page their next API call would immediately reject:
 *   1. not logged in              -> /login
 *   2. must change password       -> /change-password
 *   3. profile not completed yet  -> /complete-profile
 *   4. otherwise                  -> render the requested page
 *
 * Also runs the  inactivity timer for every authenticated page: if the
 * user goes IDLE_TIMEOUT_MS without any mouse/keyboard/scroll activity,
 * they're logged out and sent to /login with a clear explanation.
 */
export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleIdle() {
    logout();
    // Writes to sessionStorage via the shared helper -- LoginPage reads
    // this back out on mount (see api/client.js's consumeSessionEndedMessage).
    setSessionEndedMessage(
      'idle',
      'You were signed out because you were inactive for a while. Please log in again.'
    );
    navigate('/login', { replace: true });
  }

  useIdleTimer({
    timeoutMs: IDLE_TIMEOUT_MS,
    onIdle: handleIdle,
    enabled: isAuthenticated,
  });

  if (isLoading) {
    // Avoid flashing a login screen while we're still checking a stored
    // token on first load.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (
    !user.mustChangePassword &&
    !user.profileCompleted &&
    location.pathname !== '/complete-profile'
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}