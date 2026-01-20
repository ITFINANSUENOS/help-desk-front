import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import LoginPage from "./pages/LoginPage";

function Dashboard() {
  return <h1>Bienvenido al Dashboard (Protegido)</h1>;
}

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
