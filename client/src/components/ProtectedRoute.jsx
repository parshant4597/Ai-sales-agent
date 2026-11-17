import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

// Shown while the app asks the server who is signed in. If the server is briefly unreachable it
// says so and keeps trying, instead of sending a signed-in person to the login page.
function SplashScreen({ message }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" role="status" aria-label="Loading">
      <div className="animate-pulse">
        <Logo size={56} />
      </div>
      {message && (
        <p className="max-w-xs text-sm text-stone-500">
          Reconnecting to the server…
          <span className="mt-1 block text-xs text-stone-400">{message}</span>
        </p>
      )}
    </div>
  );
}

// Wraps every page that needs a login. Not signed in -> /login, and back here afterwards.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, checking, connectionError } = useAuth();
  const location = useLocation();

  if (checking) return <SplashScreen message={connectionError} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
