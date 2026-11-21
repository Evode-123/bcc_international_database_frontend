import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// The login page loads straight away; every other page is downloaded only
// when it is first opened. Before, the browser had to download ALL pages
// (charts, Excel and PDF libraries included) before showing anything, which
// is what made the first load slow.
import { LoginPage } from './pages/LoginPage';

const page = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const ForgotPasswordPage = page(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');
const ChangePasswordPage = page(() => import('./pages/ChangePasswordPage'), 'ChangePasswordPage');
const CompleteProfilePage = page(() => import('./pages/CompleteProfilePage'), 'CompleteProfilePage');
const DashboardPage = page(() => import('./pages/DashboardPage'), 'DashboardPage');
const ManageUsersPage = page(() => import('./pages/ManageUsersPage'), 'ManageUsersPage');
const RolesPermissionsPage = page(() => import('./pages/RolesPermissionsPage'), 'RolesPermissionsPage');
const ManageLocationsPage = page(() => import('./pages/ManageLocationsPage'), 'ManageLocationsPage');
const DisciplesDirectoryPage = page(() => import('./pages/DisciplesDirectoryPage'), 'DisciplesDirectoryPage');
const ReportsPage = page(() => import('./pages/ReportsPage'), 'ReportsPage');
const DiscipleFormPage = page(() => import('./pages/DiscipleFormPage'), 'DiscipleFormPage');
const DiscipleBulkAddPage = page(() => import('./pages/DiscipleBulkAddPage'), 'DiscipleBulkAddPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');
const DiscipleExcelImportPage = page(() => import('./pages/DiscipleExcelImportPage'), 'DiscipleExcelImportPage');

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen text-sm text-gray-400 gap-2">
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#0A5EB0" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes -- ProtectedRoute itself decides whether to
                show /change-password or /complete-profile first, based on
                the logged-in user's flags, before allowing anything else. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin-users" element={<ManageUsersPage />} />
              <Route path="/roles-permissions" element={<RolesPermissionsPage />} />
              <Route path="/locations" element={<ManageLocationsPage />} />
              <Route path="/disciples" element={<DisciplesDirectoryPage />} />
              <Route path="/disciples/new" element={<DiscipleFormPage />} />
              <Route path="/disciples/bulk-add" element={<DiscipleBulkAddPage />} />
              <Route path="/disciples/import" element={<DiscipleExcelImportPage />} />
              <Route path="/disciples/:id/edit" element={<DiscipleFormPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;