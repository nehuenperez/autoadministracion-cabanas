import { useContext } from 'react';
import AuthContext from '../context/AuthContext.js';

/**
 * Acceso al estado de sesión.
 *
 * Si se usa fuera del AuthProvider lanza un error explícito, en vez de
 * devolver null y romper más adelante con un "cannot read property of null"
 * en un lugar que no tiene nada que ver.
 */
export function useAuth() {
  const contexto = useContext(AuthContext);

  if (contexto === null) {
    throw new Error('useAuth tiene que usarse dentro de un <AuthProvider>');
  }

  return contexto;
}
