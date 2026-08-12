import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children, formCode }: PropsWithChildren<{ formCode?: string }>) {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return <Navigate to="/login" replace />;
  if (formCode && auth.permissions[formCode]?.canAccess === false) return <section><h2>Không có quyền truy cập</h2><p>Bạn không được cấp quyền cho module này.</p></section>;
  return <>{children}</>;
}
