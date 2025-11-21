import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ComicPage from './pages/ComicPage';
import TagsPage from './pages/TagsPage';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import ConfigPage from './pages/ConfigPage';
import { initializeTheme } from './styles/theme';

function App() {
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
      .then(() => {
        setThemeLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to initialize theme:', error);
        // Still set loaded to true to prevent blocking the app
        setThemeLoaded(true);
      });
  }, []);

  // Show loading screen while theme initializes
  if (!themeLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/comic/:slug" element={<ComicPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config" 
              element={
                <ProtectedRoute>
                  <ConfigPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="*" 
              element={
                <div>
                  <h2>404 - Page Not Found</h2>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              } 
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
