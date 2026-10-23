import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { claseDeCampo } from '../utils/estilos.js';
import Campo from '../components/comunes/Campo.jsx';
import Boton from '../components/comunes/Boton.jsx';
import Aviso from '../components/comunes/Aviso.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { usuario: sesion, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [demorado, setDemorado] = useState(false);
  const [error, setError] = useState('');
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function mensajeDeError(err) {
    // El backend contestó: usamos su mensaje (credenciales, rate limit, etc.)
    if (err.response) {
      return err.response.data?.error || 'Usuario o contraseña incorrectos';
    }
    // No hubo respuesta: es un problema de red o el servidor tardó demasiado,
    // no un error de credenciales, y el mensaje lo tiene que dejar claro.
    if (err.code === 'ECONNABORTED') {
      return 'El servidor tardó demasiado en responder. Esperá unos segundos y probá de nuevo.';
    }
    return 'No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setDemorado(false);
    setError('');

    // Si tarda más de 4s casi seguro es el servidor despertando (Render free
    // se apaga tras 15 min sin uso). Avisamos para que no parezca que se colgó.
    temporizador.current = setTimeout(() => setDemorado(true), 4000);

    try {
      // Delega en AuthContext: manda el campo con el nombre que espera el backend
      // (nombreUsuario) y deja el estado de sesión consistente antes de navegar.
      await login(usuario, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      clearTimeout(temporizador.current);
      setCargando(false);
      setDemorado(false);
    }
  }

  // Con la sesión abierta no tiene sentido volver a ingresar
  if (sesion && !cargando) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="max-w-sm w-full mx-auto space-y-8">
        <div className="text-center space-y-3">
          <img src="/favicon.svg" alt="" className="size-14 mx-auto" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Aroma del Potrero</h1>
            <p className="text-[15px] text-slate-500">Ingresá para administrar las reservas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <Campo rotulo="Usuario">
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className={claseDeCampo}
            />
          </Campo>

          <Campo rotulo="Contraseña">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={claseDeCampo}
            />
          </Campo>

          <Aviso>{error}</Aviso>
          {demorado && !error && (
            <Aviso tipo="info">El servidor se está encendiendo y puede tardar hasta un minuto. No cierres la página.</Aviso>
          )}

          <Boton type="submit" ancho icono={LogIn} disabled={cargando}>
            {cargando ? (demorado ? 'Conectando…' : 'Ingresando…') : 'Ingresar'}
          </Boton>
        </form>
      </div>
    </div>
  );
}
