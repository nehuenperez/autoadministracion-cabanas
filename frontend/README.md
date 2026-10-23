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
npm test         # tests de la lógica (node:test, sin dependencias extra)
npm run lint     # ESLint
```

El backend tiene que estar corriendo y hay que tener un usuario creado
(ver el README del backend).

## Pantallas

| Ruta | Descripción |
|---|---|
| `/login` | Ingreso |
| `/` | Calendario mensual con las reservas activas |
| `/reservas/nueva` | Alta de reserva |
| `/reservas/:id` | Detalle: huéspedes, cobros y saldo. Desde acá se editan fechas y montos, se cargan los huéspedes y se contacta al titular por WhatsApp |
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
│   └── reservas/   formulario de alta, selector de fechas, carga rápida y manual de huéspedes
├── hooks/          useAuth, useDatos (carga de datos de una pantalla)
├── services/       llamadas a la API, una por endpoint
└── utils/          lógica pura y con tests: semáforo, fechas, montos, reservas,
                    intérprete de mensajes y link de WhatsApp
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

## Carga rápida de huéspedes

En el detalle de una reserva se puede pegar el mensaje con los datos que mandó el
cliente. [`utils/interpretarMensaje.js`](src/utils/interpretarMensaje.js) lo convierte
en una lista de huéspedes (titular y acompañantes) con nombre, apellido, DNI, CUIL,
teléfono, domicilio, vehículo y patente. Funciona sin IA ni servicios externos: son
reglas sobre los formatos argentinos, con tests sobre mensajes en distintos formatos.

El resultado se muestra en tarjetas editables, con avisos sobre lo que falta o no
cierra (por ejemplo, un CUIL que no corresponde al DNI). Si un huésped ya vino, se
completan los datos que el mensaje no trajo y se muestran sus notas. Nada se guarda
sin confirmar.

## WhatsApp

Los teléfonos se guardan como los escribió el huésped. Para abrir el chat,
[`utils/whatsapp.js`](src/utils/whatsapp.js) los convierte al formato internacional
que exige `wa.me` (`549` + característica + número, sin el 0 ni el 15).

## Notas

- El token JWT se guarda en `localStorage` y se adjunta automáticamente en cada
  request desde un interceptor de Axios. Ante un `401`, la sesión se limpia sola
  y vuelve al login.
- El backend está en el plan gratuito de Render, que se apaga tras 15 minutos sin
  uso. El primer ingreso del día puede tardar hasta un minuto mientras arranca;
  la pantalla de login avisa cuando eso pasa.
