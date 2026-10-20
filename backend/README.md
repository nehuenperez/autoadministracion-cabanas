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
| `DB_SYNC` | no | `true` sincroniza el esquema al arrancar. **Nunca en producción** |

### Crear las tablas

La primera vez, con la base vacía, hay que generar el esquema:

```bash
DB_SYNC=true npm start
```

Una vez creadas las tablas, cortá el proceso y arrancá normalmente. `DB_SYNC` usa
`sequelize.sync({ alter: true })`, que **modifica el esquema existente** — puede
alterar o borrar columnas con datos. Dejala sin definir salvo que sepas lo que hacés.

### Actualizar una base existente

Si la base ya tenía datos antes de que se agregara el CUIL de los huéspedes, corré
una vez (no borra nada y se puede repetir):

```bash
node src/seed/agregarCuil.js
```

### Cargar datos iniciales

```bash
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

### Tests

```bash
npm test
```

Cubren autenticación, validación de entrada, CORS, cabeceras de seguridad, límite de
intentos y las reglas de negocio puras. Fuerzan una URL de base inexistente, así que no
pueden tocar datos reales.

## Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`, excepto `POST /api/auth/login`
y `GET /api/health`.

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
GET    /api/huespedes/:id/historial
POST   /api/huespedes               crea o actualiza según el DNI
PATCH  /api/huespedes/:id/notas
POST   /api/huespedes/reservas/:reservaId/vincular
```

### Pagos
```
GET    /api/pagos/reservas/:reservaId
GET    /api/pagos/reservas/:reservaId/saldo
POST   /api/pagos/reservas/:reservaId
DELETE /api/pagos/:id
```

### Estadísticas
```
GET    /api/estadisticas?mes=&anio=
```

## Modelo de datos

- **Cabana** — `nombre`, `capacidad`
- **Huesped** — `nombre`, `apellido`, `dni` (único), `telefono`, `direccion`, `vehiculoModelo`, `vehiculoPatente`, `notasComportamiento`
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
