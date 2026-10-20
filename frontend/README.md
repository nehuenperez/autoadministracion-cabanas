# Cabañas Potrero — Frontend

Interfaz de gestión de reservas para un complejo de cabañas en Potrero de los Funes,
San Luis. Diseñada **mobile-first**: la usuaria real la opera 100% desde el celular.

Backend: [../backend](../backend/README.md) · Visión general: [README principal](../README.md)

## Stack

- React + Vite
- Tailwind CSS v4 (vía el plugin `@tailwindcss/vite`)
- React Router DOM
- Axios
- Deploy en Vercel

## Puesta en marcha

```bash
npm install
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, incluyendo `/api`. Ej: `http://localhost:3000/api` |

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run preview  # previsualizar el build
```

El backend tiene que estar corriendo y hay que tener un usuario creado
(ver el README del backend).

## Pantallas

| Ruta | Descripción |
|---|---|
| `/login` | Ingreso |
| `/` | Calendario mensual con las reservas activas |
| `/reservas/nueva` | Alta de reserva |
| `/reservas/:id` | Detalle: huéspedes, cobros, saldo. Fechas y montos se editan desde acá |
| `/reservas-anteriores` | Historial |
| `/estadisticas` | Ingresos y ocupación por mes |

Todas menos `/login` están detrás de `RutaProtegida`.

## Organización

```
src/
├── pages/          una pantalla por ruta; cargan datos y coordinan
├── components/
│   ├── layout/     Pantalla, Encabezado, NavegacionInferior
│   ├── comunes/    Tarjeta, Aviso, CampoMonto, SelectorDeMes, MensajeFlotante...
│   ├── calendario/ calendario mensual con la agenda del día
│   ├── detalle/    las tarjetas del detalle de una reserva
│   └── reservas/   formulario de alta, selector de fechas, carga de huéspedes
├── hooks/          useAuth, useDatos (carga de datos de una pantalla)
├── services/       llamadas a la API, una por endpoint
└── utils/          lógica pura y con tests: semáforo, fechas, montos, reservas
```

La regla: las pantallas no calculan nada por su cuenta. El color de una reserva sale
siempre de `utils/semaforo.js`, el saldo de `utils/reservas.js` y el formato de los
montos de `utils/montos.js`, así ninguna pantalla contradice a otra.

## Semáforo de colores

El calendario usa color para mostrar el estado de cobro de un vistazo:

| Color | Significado |
|---|---|
| Celeste | Señada, falta más de un día para el check-in |
| Amarillo | El check-in es hoy o mañana y queda saldo: hay que cobrar |
| Verde | Saldo saldado |
| Rojo | No se cobró nada todavía, o el check-in ya pasó y queda saldo |
| Gris | Finalizada |
| Naranja | Abortada |

La definición está en [`src/utils/semaforo.js`](src/utils/semaforo.js), con tests.

## Notas

- El token JWT se guarda en `localStorage` y se adjunta automáticamente en cada
  request desde un interceptor de Axios. Ante un `401`, la sesión se limpia sola
  y vuelve al login.
- El backend está en el plan gratuito de Render, que se apaga tras 15 minutos sin
  uso. El primer ingreso del día puede tardar hasta un minuto mientras arranca;
  la pantalla de login avisa cuando eso pasa.
