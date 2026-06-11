import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public SaaS commercial landing homepage */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Secure auth portal */}
          <Route path="/login" element={<LoginScreen />} />
          
          {/* Protected Client Dashboard workspace */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all redirecting to public home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
