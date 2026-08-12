import { createContext } from 'react';

/**
 * El contexto vive en su propio archivo, separado del provider y del hook.
 *
 * Si un archivo exporta a la vez un componente y otras cosas, Fast Refresh de
 * Vite no puede recargar ese módulo en caliente y termina recargando la página
 * entera. Separarlos mantiene el hot reload funcionando.
 */
const AuthContext = createContext(null);

export default AuthContext;
