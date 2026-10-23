import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import reservasRoutes from './routes/reservas.routes.js';
import cabanasRoutes from './routes/cabanas.routes.js';
import huespedesRoutes from './routes/huespedes.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';
import { manejadorDeErrores } from './middlewares/error.middleware.js';
import sequelize from './config/database.js';

const app = express();

// Render (y cualquier hosting con proxy adelante) manda la IP real en X-Forwarded-For.
// Sin esto, el rate limit vería siempre la IP del proxy y limitaría a todos juntos.
app.set('trust proxy', 1);

// Headers de seguridad (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).
// La API sólo devuelve JSON, así que no necesita CSP de documento.
app.use(helmet({ contentSecurityPolicy: false }));

/**
 * CORS restringido por lista blanca.
 * Configurá CORS_ORIGINS en Render con los dominios de producción separados por coma, ej:
 *   CORS_ORIGINS=https://cabanas.vercel.app,http://localhost:5173
 * Si la variable no está seteada se mantiene el comportamiento actual (abierto),
 * para no romper el deploy hasta que la cargues.
 */
const origenesPermitidos = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (origenesPermitidos.length === 0) {
  console.warn(
    '⚠️  CORS_ORIGINS no está configurado: la API acepta peticiones de cualquier origen. ' +
      'Cargá los dominios de producción para cerrarlo.'
  );
  app.use(cors());
} else {
  app.use(
    cors({
      origin(origin, callback) {
        // Sin header Origin = same-origin, curl, apps móviles o health checks: se permite.
        if (!origin || origenesPermitidos.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
      },
    })
  );
}

// Límite de tamaño del body: evita que alguien mande un JSON gigante para tumbar el proceso.
app.use(express.json({ limit: '100kb' }));

// Freno de fuerza bruta sobre el login: la contraseña es la única puerta de
// entrada al sistema, así que este límite es lo que impide probarla a ciegas.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos.' },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Backend funcionando' });
});

/**
 * Como /api/health, pero además consulta la base. Lo llama el workflow
 * .github/workflows/mantener-activo.yml cada dos días: Supabase (plan gratis)
 * pausa la base tras una semana sin actividad y, pausada, el backend no
 * arranca. La consulta cuenta como actividad, y si falla el workflow avisa.
 */
app.get('/api/health/db', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.json({ status: 'ok', base: 'ok' });
  } catch (error) {
    console.error('Chequeo de la base falló:', error.message);
    res.status(503).json({ status: 'error', base: 'sin conexión' });
  }
});

app.use('/api/auth/login', limitadorLogin);

app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/cabanas', cabanasRoutes);
app.use('/api/huespedes', huespedesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

app.use(manejadorDeErrores);

export default app;
