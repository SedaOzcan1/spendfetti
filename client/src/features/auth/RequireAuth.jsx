import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../../api/auth.js';

function FullPageMessage({ children }) {
  return (
    <div role="status" className="grid min-h-screen place-items-center bg-page text-muted">
      {children}
    </div>
  );
}

export function RequireAuth() {
  const { data: user, isPending, isError } = useMe();
  const location = useLocation();

  if (isPending) return <FullPageMessage>Loading…</FullPageMessage>;
  if (isError) return <FullPageMessage>Couldn’t reach the server. Please refresh.</FullPageMessage>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const { data: user, isPending } = useMe();
  if (isPending) return <FullPageMessage>Loading…</FullPageMessage>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
