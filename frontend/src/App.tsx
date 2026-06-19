import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DocumentsManager } from './pages/DocumentsManager';
import { CaseDetail } from './pages/CaseDetail';
import { GlobalStatisticsPage } from './pages/GlobalStaticsPage';
import { GlobalTimesPage } from './pages/GlobalTimesPage';
import { MainLayout } from './layouts/MainLayout';
import { StatesAdminPage } from './pages/Admin/StatesAdminPage';
import { SurveyConfigEditor } from './pages/Admin/SurveyConfigEditor';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { DocumentTypesAdmin } from './pages/Admin/DocumentTypesAdmin';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protegidas — requieren sesión */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentsManager /></ProtectedRoute>} />
          <Route path="/cases/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />

          <Route path="/estadisticas" element={
            <ProtectedRoute requiredPermissions={['canViewGlobalStats']}>
              <GlobalStatisticsPage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/states" element={
            <ProtectedRoute requiredRole={['ADMINISTRADOR', 'SUPERVISOR']}>
              <StatesAdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/times" element={
            <ProtectedRoute requiredPermissions={['canManageTimes']}>
              <MainLayout><GlobalTimesPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/survey-builder" element={
            <ProtectedRoute requiredPermissions={['canEditSurveys']}>
              <SurveyConfigEditor />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredPermissions={['canManageUsers']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/document-types" element={
            <ProtectedRoute requiredRole={['ADMINISTRADOR']}>
              <DocumentTypesAdmin />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
