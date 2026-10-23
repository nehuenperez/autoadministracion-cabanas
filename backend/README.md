# Cabañas Potrero — API

API REST para la gestión de reservas de un complejo de cabañas en Potrero de los Funes,
San Luis. Maneja reservas, huéspedes, cobros parciales y estadísticas mensuales.

Es un sistema en uso real: lo opera una sola persona, desde el celular.

Visión general del proyecto: [README principal](../README.md)

## Stack

- Node.js + Express (ES Modules)
- Sequelize ORM sobre PostgreSQL (Supabase)
- Autenticación JWT + bcrypt
- Validación de entrada con Zod
- Migraciones con Umzug
- Deploy en Render

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar los valores
```

Variables de entorno (ver `.env.example`):

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Cadena de conexión de PostgreSQL |
| `JWT_SECRET` | sí | Mínimo 32 caracteres. Generar con `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | no | Duración del token. Por defecto `30d` |
| `PORT` | no | Por defecto `3000` |
| `CORS_ORIGINS` | recomendada | Dominios autorizados, separados por coma. Si queda vacía la API acepta cualquier origen |
| `DB_SSL` | no | `false` desactiva SSL, sólo para un Postgres local. Por defecto, SSL activado |

### Esquema de la base: migraciones

El esquema se maneja con migraciones ([umzug](https://github.com/sequelize/umzug)):
cada cambio de estructura es un archivo en `src/migraciones/` que se aplica una sola
vez. La tabla `migraciones` de la base registra cuáles ya corrieron.

**El servidor aplica las pendientes cada vez que arranca**, así que no hay que
correr nada a mano: con una base vacía crea las tablas, y con la base al día no
hace nada. Para aplicarlas sin levantar el servidor: `npm run migrar`.

La migración inicial (`0001-esquema-inicial.js`) describe las tablas tal como
estaban en producción. Contra una base con datos no cambia nada: sólo crea lo que
falta. Los tests lo verifican sobre una base con datos cargados.

**Para cambiar el esquema**, agregá un archivo nuevo con el número siguiente
(`0002-...js`) que exporte `up` (y `down` si se puede deshacer), y actualizá el
modelo para que coincida. El test `esquema.test.js` falla si modelos y migraciones
no generan exactamente el mismo esquema.

### Cargar datos iniciales

```bash
npm run migrar                  # crea las tablas (sólo con una base nueva)
node src/seed/crearCabanas.js   # carga las cabañas
node src/seed/crearUsuario.js   # pide usuario y contraseña por consola
```

`crearUsuario.js` es interactivo y no muestra la contraseña mientras la tipeás.
No hay endpoint público de registro: los usuarios se crean sólo con este script.

Para cambiarle la contraseña a un usuario existente:

```bash
node src/seed/cambiarPassword.js
```

También pide los datos por consola. La contraseña no se acepta por argumento ni por
variable de entorno a propósito: así no queda en el historial de la terminal ni en la
lista de procesos del sistema.

### Levantar el servidor

```bash
npm run dev    # desarrollo, con recarga automática
npm start      # producción
```

Al arrancar, el servidor se conecta a la base (con reintentos si no responde de
entrada), aplica las migraciones pendientes y recién después empieza a atender.

### Tests

```bash
npm test
```

Hay dos grupos:

- **Sin base**: autenticación, validación de entrada, CORS, cabeceras de seguridad,
  límite de intentos y reintentos de conexión. Fuerzan una URL de base inexistente.
- **Con base**: reglas de negocio (disponibilidad, cobros, estados, huéspedes),
  estadísticas y migraciones. Levantan un Postgres real y descartable con los
  binarios de `embedded-postgres`, en una carpeta temporal que se borra al
  terminar. No hace falta instalar Postgres ni Docker.

Ninguno puede tocar los datos reales: nunca leen `DATABASE_URL` del `.env`.

En Windows, el Postgres de prueba necesita el runtime de Visual C++. Si falta, los
tests con base fallan con un mensaje que lo dice: instalá
*Microsoft Visual C++ Redistributable (x64)*.

## Deploy en Render

| Opción | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

`--omit=dev` evita instalar las dependencias de desarrollo: entre ellas está
`embedded-postgres`, que descarga unos 100 MB de binarios de Postgres que sólo usan
los tests. Las variables de entorno se cargan en *Environment* (ver la tabla de arriba).

En el plan gratuito, Supabase pausa la base tras una semana sin actividad. El workflow
[`mantener-activo.yml`](../.github/workflows/mantener-activo.yml) consulta
`/api/health/db` cada dos días para evitarlo, y avisa por mail si falla.

## Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`, excepto el login y los
chequeos de salud.

### Salud
```
GET    /api/health                  el servidor responde
GET    /api/health/db               el servidor responde y la base también (503 si no)
```

### Auth
```
POST   /api/auth/login              { nombreUsuario, password } -> { token, usuario }
```
Limitado a 10 intentos cada 15 minutos por IP.

### Reservas
```
GET    /api/reservas                activas (Señada / Pagada)
GET    /api/reservas/historicas     Finalizada / Abortada
GET    /api/reservas/:id
POST   /api/reservas
PUT    /api/reservas/:id
PATCH  /api/reservas/:id/abortar
```

### Huéspedes
```
GET    /api/huespedes/dni/:dni      autocompletado por DNI
POST   /api/huespedes               crea o actualiza según el DNI
POST   /api/huespedes/reservas/:reservaId/vincular   reemplaza los huéspedes de la reserva
```

### Pagos
```
POST   /api/pagos/reservas/:reservaId
DELETE /api/pagos/:id
```

Los cobros de una reserva y su saldo pendiente vienen incluidos en `GET /api/reservas/:id`.

### Estadísticas
```
GET    /api/estadisticas?mes=&anio=
```

## Modelo de datos

- **Cabana** — `nombre`, `capacidad`
- **Huesped** — `nombre`, `apellido`, `dni` (único), `cuil`, `telefono`, `direccion`, `vehiculoModelo`, `vehiculoPatente`, `notasComportamiento`
- **Reserva** — `cabanaId`, `fechaCheckIn`, `fechaCheckOut`, `montoTotal`, `porcentajeSena`, `montoSena`, `estado`
- **ReservaHuesped** — vincula reservas con huéspedes, con `rol` (titular / acompañante)
- **Pago** — `reservaId`, `monto`, `fecha`, `metodoPago`
- **Usuario** — `nombreUsuario`, `passwordHash`

## Reglas de negocio

- **Disponibilidad**: una cabaña está ocupada si existe una reserva `Señada` o `Pagada`
  que se solape. Dos rangos se solapan si `checkIn1 < checkOut2 && checkOut1 > checkIn2`.
- **Seña**: opcional. `montoSena = montoTotal * (porcentajeSena / 100)`, siempre calculada
  en el backend — el frontend nunca la manda.
- **Estado `Pagada`**: automático, cuando la suma de pagos alcanza el `montoTotal`.
- **Estado `Finalizada`**: automático, cuando el check-out ya pasó.
- **Estadísticas**: la ocupación no cuenta las reservas canceladas; lo que se les
  cobró sí suma en los ingresos.
- Toda reserva tiene exactamente un titular.

## Scripts destructivos

`src/seed/limpiarBase.js` vacía reservas, huéspedes y pagos de la base apuntada por
`DATABASE_URL`. Exige confirmación explícita:

```bash
CONFIRMAR_BORRADO=SI_BORRAR_TODO node src/seed/limpiarBase.js
```

## Notas de seguridad

- Las contraseñas se guardan con bcrypt (cost 12). Nunca en texto plano.
- Los errores no exponen stack traces ni mensajes crudos del ORM.
- Todas las consultas pasan por el ORM parametrizado.
- `helmet` para headers de seguridad y límite de 100 kb en el body.
