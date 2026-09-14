import { useEffect, useState } from 'react';
  import { NavLink, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  import { TopbarSearch } from './TopbarSearch';

  // ── Icons ─────────────────────────────────────────────────────────────────────

  function IconDashboard() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    );
  }
  function IconDisciples() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    );
  }
  function IconLocations() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    );
  }
  function IconUsers() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    );
  }
  function IconRoles() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    );
  }
  function IconReports() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    );
  }
  function IconSettings() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    );
  }
  function IconLogout() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    );
  }
  function IconBell() {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    );
  }
  function IconMenu() {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    );
  }
  function IconClose() {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    );
  }
  function IconSearch() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    );
  }

  // BCC logo — with fallback initials
  function BCCLogoMark({ size = 40 }) {
    return (
      <div
        style={{ width: size, height: size, flexShrink: 0 }}
        className="rounded-full overflow-hidden ring-2 ring-white/20"
      >
        <img
          src="/bcc_logo.png"
          alt="BCC"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.style.cssText += `;background:#1E7FD8;display:flex;align-items:center;justify-content:center;`;
            const span = document.createElement('span');
            span.textContent = 'BCC';
            span.style.cssText = `color:white;font-weight:800;font-size:${Math.round(size*0.28)}px;font-family:sans-serif`;
            e.target.parentElement.appendChild(span);
          }}
        />
      </div>
    );
  }

  // ── Nav items ─────────────────────────────────────────────────────────────────
  // `permission`, when set, is checked against the logged-in user's actual
  // granted permissions (see AuthContext's hasPermission). A nav item with
  // no `permission` is always shown to any authenticated user.
  const NAV_ITEMS = [
    { to: '/dashboard',         label: 'Dashboard',           Icon: IconDashboard, permission: 'disciple.view' },
    { to: '/disciples',         label: 'Disciples',           Icon: IconDisciples, permission: 'disciple.view' },
    { to: '/locations',         label: 'Plan',                Icon: IconLocations, permission: 'location.manage' },
    { to: '/reports',   label: 'Reports',   Icon: IconReports,   permission: 'report.generate' },
    { to: '/admin-users',       label: 'Manage users',        Icon: IconUsers,     permission: 'user.manage' },
    { to: '/roles-permissions', label: 'Roles & permissions', Icon: IconRoles,     permission: 'role.manage' },
  ];

  // ── Reusable nav-link row (used by both the top nav items and Settings) ───────

  function SidebarLink({ to, label, Icon, collapsed, onClick }) {
    return (
      <NavLink
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          `flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          } ${
            isActive
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/65 hover:bg-white/10 hover:text-white/90'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {!collapsed && (
              <span
                className={`w-1 h-5 rounded-full flex-shrink-0 transition-all ${isActive ? 'bg-white' : 'bg-transparent'}`}
                style={{ marginLeft: -4 }}
              />
            )}
            <Icon />
            {!collapsed && <span className="truncate">{label}</span>}
          </>
        )}
      </NavLink>
    );
  }

  // ── Sidebar content (shared between fixed desktop + mobile drawer) ────────────

  function SidebarContent({ collapsed, onNavClick, onLogout, user, hasPermission }) {
    return (
      <div className="flex flex-col h-full">

        {/* Logo */}
        <div
          className="flex items-center gap-3 border-b border-white/10"
          style={{ padding: collapsed ? '20px 0' : '20px', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <BCCLogoMark size={40} />
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-tight">BCC</p>
              <p className="text-white/60 text-xs leading-tight">International</p>
            </div>
          )}
        </div>

        {/* Main nav links — filtered live against the user's actual granted
            permissions, so a change in Roles & Permissions hides/shows the
            right links without any other code change. Settings intentionally
            lives at the bottom, not in this scrollable block. */}
        <nav className="flex-1 py-4 overflow-y-auto" style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              if (item.permission && !hasPermission(item.permission)) return null;
              return (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  Icon={item.Icon}
                  collapsed={collapsed}
                  onClick={onNavClick}
                />
              );
            })}
          </div>
        </nav>

        {/* Settings — pinned directly above Log out at the bottom of the
            sidebar. No top divider here; the only line is the one above
            Log out below. */}
        <div style={{ padding: collapsed ? '12px 8px 20px' : '12px 12px 20px' }}>
          <SidebarLink
            to="/settings"
            label="Settings"
            Icon={IconSettings}
            collapsed={collapsed}
            onClick={onNavClick}
          />
        </div>

        {/* Log out — its own standalone bordered section at the very
            bottom, separate from Settings above. */}
        <div
          className="border-t border-white/10"
          style={{ padding: collapsed ? '12px 8px' : '12px 12px' }}
        >
          <button
            onClick={onLogout}
            title={collapsed ? 'Log out' : undefined}
            className={`flex items-center w-full rounded-xl text-sm text-white/55
                        hover:bg-white/10 hover:text-white/80 transition-all
                        ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
          >
            {!collapsed && <span className="w-1 h-5 flex-shrink-0" style={{ marginLeft: -4 }} />}
            <IconLogout />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    );
  }

  // ── AppLayout ─────────────────────────────────────────────────────────────────

  const SIDEBAR_W   = 240;  // px — full sidebar
  const SIDEBAR_COL = 64;   // px — collapsed (icons only, md breakpoint)
  const TOPBAR_H    = 62;   // px

  export function AppLayout({ children }) {
    const { user, logout, hasPermission, refreshPermissions } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [drawerOpen, setDrawerOpen]     = useState(false); // mobile drawer
    const [profileOpen, setProfileOpen]   = useState(false);

    // Close drawer on route change (mobile)
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
      document.body.style.overflow = drawerOpen ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    // Every time a page using AppLayout mounts (i.e. on every navigation,
    // since pages aren't nested under one persistent layout route), quietly
    // re-check this user's permissions with the server. This is what makes
    // a super_admin's change in Roles & Permissions take effect for an
    // already-logged-in user without them needing to log out and back in --
    // it just shows up the next time they move to a new page.
    useEffect(() => {
      refreshPermissions();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLogout() {
      logout();
      navigate('/login', { replace: true });
    }

    const userInitials = (user?.fullName || user?.email || 'U')
      .split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

    return (
      <>
        {/*
          ═══════════════════════════════════════════════════════════
          DESKTOP FIXED SIDEBAR  (hidden on mobile, icon-only on md)
          ═══════════════════════════════════════════════════════════
          We use position:fixed so it never scrolls with the page.
          The main content area is offset with a left margin equal
          to the sidebar width.
        */}

        {/* ── Desktop sidebar: full (lg+) ── */}
        <aside
          className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30"
          style={{
            width: SIDEBAR_W,
            background: 'linear-gradient(175deg, #0A2E6E 0%, #0A5EB0 100%)',
            boxShadow: '4px 0 24px rgba(10,46,110,0.18)',
          }}
        >
          <SidebarContent
            collapsed={false}
            onNavClick={() => {}}
            onLogout={handleLogout}
            user={user}
            hasPermission={hasPermission}
          />
        </aside>

        {/* ── Desktop sidebar: icon-only (md only) ── */}
        <aside
          className="hidden md:flex lg:hidden flex-col fixed top-0 left-0 bottom-0 z-30"
          style={{
            width: SIDEBAR_COL,
            background: 'linear-gradient(175deg, #0A2E6E 0%, #0A5EB0 100%)',
            boxShadow: '4px 0 24px rgba(10,46,110,0.18)',
          }}
        >
          <SidebarContent
            collapsed={true}
            onNavClick={() => {}}
            onLogout={handleLogout}
            user={user}
            hasPermission={hasPermission}
          />
        </aside>

        {/*
          ═══════════════════════════════════════════════════════
          MOBILE DRAWER  (slide-in overlay, small screens only)
          ═══════════════════════════════════════════════════════
        */}
        {/* Overlay backdrop */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(10,46,110,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Drawer panel */}
        <aside
          className="fixed top-0 left-0 bottom-0 z-50 flex flex-col md:hidden transition-transform duration-300"
          style={{
            width: SIDEBAR_W,
            background: 'linear-gradient(175deg, #0A2E6E 0%, #0A5EB0 100%)',
            boxShadow: '4px 0 32px rgba(10,46,110,0.25)',
            transform: drawerOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          }}
        >
          {/* Close button inside drawer */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center
                      text-white/60 hover:text-white hover:bg-white/10 transition-all"
            type="button"
          >
            <IconClose />
          </button>
          <SidebarContent
            collapsed={false}
            onNavClick={() => setDrawerOpen(false)}
            onLogout={handleLogout}
            user={user}
            hasPermission={hasPermission}
          />
        </aside>

        {/*
          ═══════════════════════════════════════════════════════
          MAIN AREA  — offset left by sidebar width so content
          never slides under the fixed sidebar
          ═══════════════════════════════════════════════════════
        */}
        <div
          className="flex flex-col min-h-screen"
          style={{
            // No offset on mobile (sidebar is a drawer overlay)
            // Icon-only offset on md, full offset on lg
            marginLeft: 0,
          }}
        >
          {/* Apply margin via responsive classes on an inner wrapper */}
          <div
            className="flex flex-col min-h-screen"
            style={{ background: '#EEF5FB' }}
          >
            <div className="flex flex-col min-h-screen md:pl-16 lg:pl-60">

              {/* ── Topbar — fixed to the top of the content area ── */}
              <header
                className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-7 flex-shrink-0"
                style={{
                  height: TOPBAR_H,
                  background: 'white',
                  borderBottom: '1px solid #D6E8F7',
                  boxShadow: '0 2px 8px rgba(10,94,176,0.06)',
                }}
              >
                {/* Left: hamburger (mobile only) + page breadcrumb area */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Hamburger — mobile only */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center
                              text-brand hover:bg-brand-pale transition-all"
                    type="button"
                    aria-label="Open menu"
                  >
                    <IconMenu />
                  </button>

                  {/* BCC wordmark — shown in topbar on mobile when sidebar is hidden */}
                  <span className="md:hidden font-bold text-sm text-brand">BCC Disciples</span>
                </div>

                {/* Center: search bar — visible from sm upward, where there's
                    room for it alongside the wordmark/hamburger on the left
                    and bell/profile on the right */}
                <div className="flex-1 max-w-md mx-2 hidden sm:block">
                  <TopbarSearch />
                </div>

                {/* Right: mobile search icon + bell + profile */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">

                  {/* Search — icon-only on mobile, where there's no room for
                      a full input; taps straight through to the directory,
                      which has its own search field. */}
                  <button
                    onClick={() => navigate('/disciples')}
                    className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center
                              text-brand/70 hover:text-brand hover:bg-brand-pale transition-all"
                    title="Search disciples"
                    type="button"
                    aria-label="Search"
                  >
                    <IconSearch />
                  </button>

                  {/* Notification bell */}
                  <button
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center
                              text-brand/70 hover:text-brand hover:bg-brand-pale transition-all"
                    title="Notifications"
                    type="button"
                  >
                    <IconBell />
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: '#CC1111' }}
                    />
                  </button>

                  {/* Divider */}
                  <span className="w-px h-6 hidden sm:block" style={{ background: '#D6E8F7' }} />

                  {/* Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 sm:gap-2.5 rounded-xl px-1.5 sm:px-2 py-1.5
                                hover:bg-brand-pale transition-all"
                      type="button"
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center
                                  text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #1E7FD8, #0A2E6E)' }}
                      >
                        {userInitials}
                      </div>
                      {/* Name + role — hidden on small screens */}
                      <div className="text-left hidden sm:block">
                        <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[110px] truncate">
                          {user?.fullName || user?.email}
                        </p>
                        <p className="text-[10px] text-brand leading-tight capitalize">
                          {user?.role?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" className="text-gray-400 hidden sm:block">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {/* Dropdown — account info + Log out only. Changing the
                        password and editing profile info now live under
                        Settings in the sidebar instead. */}
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileOpen(false)}
                        />
                        <div
                          className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-20 py-1.5 overflow-hidden bg-white"
                          style={{
                            boxShadow: '0 8px 32px rgba(10,94,176,0.16)',
                            border: '1px solid #D6E8F7',
                          }}
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user?.fullName || '—'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          </div>
                          <button
                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600
                                      hover:bg-red-50 transition-colors"
                          >
                            Log out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </header>

              {/* ── Page content — scrolls independently of the sidebar ── */}
              <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0">
                {children}
              </main>

            </div>
          </div>
        </div>
      </>
    );
  }