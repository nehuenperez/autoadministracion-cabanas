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
| `/reservas/:id` | Detalle: huéspedes, cobros, saldo |
| `/reservas/:id/editar` | Edición |
| `/reservas-anteriores` | Historial |
| `/estadisticas` | Ingresos y ocupación por mes |

Todas menos `/login` están detrás de `RutaProtegida`.

## Semáforo de colores

El calendario usa color para mostrar el estado de cobro de un vistazo:

| Color | Significado |
|---|---|
| Celeste | Señada, faltan más de 24 h para el check-in |
| Amarillo | Señada, faltan 24 h o menos |
| Verde | Saldo saldado |
| Rojo | El check-in ya pasó y queda saldo pendiente |
| Azul oscuro | Finalizada |
| Naranja | Abortada |

## Notas

- El token JWT se guarda en `localStorage` y se adjunta automáticamente en cada
  request desde un interceptor de Axios. Ante un `401`, la sesión se limpia sola
  y vuelve al login.
- El backend está en el plan gratuito de Render, que se apaga tras 15 minutos sin
  uso. El primer ingreso del día puede tardar hasta un minuto mientras arranca;
  la pantalla de login avisa cuando eso pasa.
