import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center px-4 antialiased">
      <div className="max-w-sm w-full mx-auto bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs space-y-6">
        
        {/* Encabezado del Login */}
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Acceso al Sistema</span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Cabañas Aroma del potrero</h1>
          <p className="text-[11px] text-slate-400 font-medium">Ingresá las credenciales para administrar</p>
        </div>

        {/* Formulario Táctil */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo Usuario */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ej: Mama"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition text-slate-800"
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 text-sm font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-600/10 focus:border-blue-500 transition text-slate-800"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-center text-xs font-semibold text-rose-600 animate-aparecer">
              {error}
            </div>
          )}

          {demorado && !error && (
            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-center text-xs font-semibold text-amber-700 animate-aparecer">
              Encendiendo el servidor, puede tardar hasta un minuto. No cierres la página.
            </div>
          )}

          {/* Botón de Ingreso Principal */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.995] text-white p-3.5 rounded-xl font-bold transition text-xs shadow-xs tracking-wide uppercase disabled:bg-slate-300 cursor-pointer mt-2"
          >
            {cargando ? (demorado ? 'Conectando...' : 'Ingresando...') : 'Ingresar'}
          </button>

        </form>
      </div>
    </div>
  );
}