import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/** Ruta contenedora: sin sesión manda al login; con sesión muestra la ruta hija. */
export default function RutaProtegida() {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
