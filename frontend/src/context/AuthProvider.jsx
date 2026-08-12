import { useState } from 'react';
import AuthContext from './AuthContext.js';
import { login as loginService } from '../services/auth.service.js';

/**
 * Estado de sesión de la aplicación.
 *
 * Es el único lugar donde se escribe la sesión. Las pantallas nunca guardan el
 * token por su cuenta: si lo hicieran, el estado de React y localStorage
 * podrían quedar desincronizados y las rutas protegidas rebotarían al login
 * aunque el token fuera válido.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    if (!guardado) return null;

    try {
      return JSON.parse(guardado);
    } catch {
      // Si el dato quedó corrupto, se descarta y se arranca sin sesión
      localStorage.removeItem('usuario');
      return null;
    }
  });

  async function login(nombreUsuario, password) {
    const data = await loginService(nombreUsuario, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
