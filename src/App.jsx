import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import QuestionBankApp from './QuestionBankApp';
import TestListPage from './pages/TestListPage';
import TestDetailsPage from './pages/TestDetailsPage';
<<<<<<< HEAD
=======
import ReportsListPage from './pages/ReportsListPage';
import ReportDetailPage from './pages/ReportDetailPage';
>>>>>>> c81da1a (Added the Analytics)
import { ToastProvider } from './components/tc/Toast';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/test-configuration" replace />} />
            <Route path="/dashboard" element={<Navigate to="/test-configuration" replace />} />
            <Route path="/question-bank/*" element={<QuestionBankApp />} />
            <Route path="/test-configuration" element={<TestListPage />} />
            <Route path="/test-configuration/details/:id" element={<TestDetailsPage />} />
<<<<<<< HEAD
=======
            <Route path="/reports" element={<ReportsListPage />} />
            <Route path="/reports/:testId" element={<ReportDetailPage />} />
>>>>>>> c81da1a (Added the Analytics)
            <Route path="*" element={<Navigate to="/test-configuration" replace />} />
          </Routes>
        </MainLayout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
