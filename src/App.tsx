import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import MemberLogin from './components/MemberLogin';
import WebReportDashboard from './components/WebReportDashboard';
import PrivacyPolicyViewer from './components/PrivacyPolicyViewer';
import MarkdownContentViewer from './components/MarkdownContentViewer';
import { ToastProvider } from './components/Toast';
import { injectThemeStyles } from './utils/themeColors';
import { onUnauthorized } from './config/api';

function App() {
  const location = useLocation();

  // Inject theme styles once on mount
  useEffect(() => {
    injectThemeStyles();
  }, []);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isMemberAuthenticated, setIsMemberAuthenticated] = useState(false);
  const [adminAuthSeed, setAdminAuthSeed] = useState('');
  const [memberAuthSeed, setMemberAuthSeed] = useState('');

  const handleAdminLogout = useCallback(() => {
    localStorage.removeItem('adminAuthSeed');
    localStorage.removeItem('adminSessionKey');
    setIsAdminAuthenticated(false);
    setAdminAuthSeed('');
  }, []);

  const handleMemberLogout = useCallback(() => {
    localStorage.removeItem('memberAuthSeed');
    localStorage.removeItem('memberSessionKey');
    setIsMemberAuthenticated(false);
    setMemberAuthSeed('');
  }, []);

  // Register for 401 unauthorized callbacks to auto-logout
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      // Determine which user to logout based on current path
      const isAdminPath = location.pathname.startsWith('/admin');
      const isMemberPath = location.pathname.startsWith('/webreport');

      if (isAdminPath && isAdminAuthenticated) {
        handleAdminLogout();
      } else if (isMemberPath && isMemberAuthenticated) {
        handleMemberLogout();
      } else {
        // Fallback: logout both if path is unclear
        if (isAdminAuthenticated) handleAdminLogout();
        if (isMemberAuthenticated) handleMemberLogout();
      }
    });

    return unsubscribe;
  }, [location.pathname, isAdminAuthenticated, isMemberAuthenticated, handleAdminLogout, handleMemberLogout]);

  useEffect(() => {
    // Check if admin is already authenticated
    const storedAdminAuthSeed = localStorage.getItem('adminAuthSeed');
    if (storedAdminAuthSeed) {
      setIsAdminAuthenticated(true);
      setAdminAuthSeed(storedAdminAuthSeed);
    }

    // Check if member is already authenticated
    const storedMemberAuthSeed = localStorage.getItem('memberAuthSeed');
    if (storedMemberAuthSeed) {
      setIsMemberAuthenticated(true);
      setMemberAuthSeed(storedMemberAuthSeed);
    }
  }, []);

  const handleAdminLoginSuccess = (newAuthSeed: string) => {
    setIsAdminAuthenticated(true);
    setAdminAuthSeed(newAuthSeed);
  };

  const handleMemberLoginSuccess = (newAuthSeed: string) => {
    setIsMemberAuthenticated(true);
    setMemberAuthSeed(newAuthSeed);
  };

  return (
    <ToastProvider>
    <div className="App">
      <Routes>
        {/* Admin Routes */}
        <Route 
          path="/adminlogin" 
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAdminAuthenticated ? (
              <AdminDashboard 
                authSeed={adminAuthSeed}
                onLogout={handleAdminLogout}
              />
            ) : (
              <Navigate to="/adminlogin" replace />
            )
          } 
        />

        {/* Member Routes */}
        <Route 
          path="/login" 
          element={
            isMemberAuthenticated ? (
              <Navigate to="/webreport" replace />
            ) : (
              <MemberLogin onLoginSuccess={handleMemberLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/webreport" 
          element={
            isMemberAuthenticated ? (
              <WebReportDashboard 
                authSeed={memberAuthSeed}
                onLogout={handleMemberLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Privacy Policy Route - Public */}
        <Route 
          path="/privacy-policy" 
          element={<PrivacyPolicyViewer />}
        />

        {/* Markdown Content Route - Public */}
        <Route 
          path="/content" 
          element={<MarkdownContentViewer />}
        />

        {/* Default Route - Redirect to login */}
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />}
        />

        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
    </ToastProvider>
  );
}

export default App;
