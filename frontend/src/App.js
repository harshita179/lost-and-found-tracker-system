import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ItemLookupPage from './pages/ItemLookupPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" replace /> : <SignupPage onSignupSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <Dashboard token={token} user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute token={token}>
              <AdminDashboard token={token} user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/item/:id" element={<ItemLookupPage />} />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
