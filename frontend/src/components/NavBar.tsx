import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './NavBar.css';

function NavBar() {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Home
        </NavLink>
        
        <NavLink 
          to="/tags" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Tags
        </NavLink>
        
        {isAuthenticated && (
          <button onClick={handleLogout} className="nav-link logout-button">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
