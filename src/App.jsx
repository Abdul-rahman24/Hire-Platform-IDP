import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import QuestionBankApp from './QuestionBankApp';
import TestListPage from './pages/TestListPage';
import TestDetailsPage from './pages/TestDetailsPage';
import ReportsListPage from './pages/ReportsListPage';
import ReportDetailPage from './pages/ReportDetailPage';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './components/tc/Toast';

// Secure route guard wrapper
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('idp_admin_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Standalone Login Route (No Sidebar/TopNav wrapper) */}
          <Route path="/login" element={<LoginPage onLoginSuccess={() => { window.location.href = '/'; }} />} />

          {/* Main Console Application Dashboard Routes (Protected) */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/question-bank" replace />} />
                    <Route path="/dashboard" element={<Navigate to="/question-bank" replace />} />
                    <Route path="/question-bank/*" element={<QuestionBankApp />} />
                    <Route path="/test-configuration" element={<TestListPage />} />
                    <Route path="/test-configuration/details/:id" element={<TestDetailsPage />} />
                    <Route path="/reports" element={<ReportsListPage />} />
                    <Route path="/reports/:testId" element={<ReportDetailPage />} />
                    <Route path="*" element={<Navigate to="/question-bank" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
