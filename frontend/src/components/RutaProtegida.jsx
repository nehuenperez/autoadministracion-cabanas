import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}