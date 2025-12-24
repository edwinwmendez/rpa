// Main App Component
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AgentStatusBanner } from './components/AgentStatusBanner';
import { ToastContainer, useToast } from './components/ui/toast';
import { setToastInstance } from './lib/toastHelper';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Diagnostic from './pages/Diagnostic';
import WorkflowsPage from './pages/WorkflowsPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';
import SettingsPage from './pages/SettingsPage';

function ToastProvider() {
  const { toasts, removeToast, success, error, info, warning } = useToast();
  
  // Registrar instancia global para uso en stores
  React.useEffect(() => {
    setToastInstance({ success, error, info, warning });
  }, [success, error, info, warning]);
  
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <ToastProvider />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas protegidas */}
          <Route
            element={
              <ProtectedRoute>
                <>
                  <AgentStatusBanner />
                  <MainLayout />
                </>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="workflows/new" element={<WorkflowEditorPage />} />
            <Route path="workflows/:id" element={<WorkflowEditorPage />} />
            <Route path="diagnostic" element={<Diagnostic />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
