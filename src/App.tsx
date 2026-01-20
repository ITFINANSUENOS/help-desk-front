import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import LoginPage from "./pages/LoginPage";
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import RoleDetailPage from './pages/RoleDetailPage';
import PermissionsPage from './pages/PermissionsPage';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/useAuth';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#f6f8f8]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:id"
            element={
              <ProtectedRoute>
                <RoleDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <ProtectedRoute>
                <PermissionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
