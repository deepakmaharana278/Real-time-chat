import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './pages/Chat';
import Authentication from './Auth/Authentication';
import VerifyEmail from './Auth/VerifyEmail';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/chat" /> : <Authentication onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/chat" /> : <Authentication onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/verify-email/:token" 
          element={<VerifyEmail />} 
        />
        <Route 
          path="/chat" 
          element={
            user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/chat" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;