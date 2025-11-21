import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Header.css';

function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="site-title">
          <h1>Comic Site</h1>
        </Link>
        
        <div className="header-actions">
          {isLoading ? (
            <span className="auth-status">Loading...</span>
          ) : isAuthenticated ? (
            <>
              <span className="auth-status">
                Hello, {user?.email || 'Artist'}
              </span>
              <Link to="/upload" className="upload-link">
                Upload Comic
              </Link>
            </>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
