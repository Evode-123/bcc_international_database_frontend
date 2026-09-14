import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { ManageUsersPage } from './pages/ManageUsersPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { ManageLocationsPage } from './pages/ManageLocationsPage';
import { DisciplesDirectoryPage } from './pages/DisciplesDirectoryPage';
import { ReportsPage } from './pages/ReportsPage';   // add this line
import { DiscipleFormPage } from './pages/DiscipleFormPage';
import { DiscipleBulkAddPage } from './pages/DiscipleBulkAddPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiscipleExcelImportPage } from './pages/DiscipleExcelImportPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="/reports" element={<ReportsPage />} />   {/* add this line */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
 
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;