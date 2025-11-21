import { useAuth } from '../auth/useAuth';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="login-page">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = () => {
    login();
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <p>Sign in to upload and manage your comics</p>
      <button onClick={handleLogin} className="login-button">
        Sign in with Cognito
      </button>
    </div>
  );
}

export default LoginPage;
