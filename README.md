# Autoadministración de Cabañas

Sistema de gestión de reservas para un complejo de cabañas en Potrero de los Funes,
San Luis. No es un proyecto de práctica: está en producción y lo usa todos los días
la dueña del complejo para administrar las reservas, los huéspedes y los cobros.

Ese detalle condicionó cada decisión de diseño. La usuaria trabaja **siempre desde el
celular**, no es técnica, y si algo falla se queda sin poder tomar una reserva. De ahí
que la interfaz sea mobile-first y que la información crítica —cuánto falta cobrar,
qué cabaña está libre— se lea de un vistazo, sin menús ni pasos intermedios.

---

## Qué resuelve

Antes el control se llevaba en papel y en notas del teléfono. Los problemas concretos
que aparecían eran tres:

- **Sobreventa.** Dos reservas superpuestas en la misma cabaña.
- **Cobros perdidos.** Señas cobradas a medias, sin registro de cuánto faltaba.
- **Huéspedes repetidos.** Volver a pedir todos los datos a alguien que ya se había alojado.

El sistema ataca los tres: valida disponibilidad antes de confirmar, lleva el saldo de
cada reserva con un semáforo de colores, y autocompleta los datos del huésped a partir
del DNI.

---

## Stack

**Backend** — Node.js · Express · Sequelize · PostgreSQL (Supabase) · JWT · Zod
**Frontend** — React · Vite · Tailwind CSS v4 · React Router · Axios
**Infraestructura** — Render (API) · Vercel (frontend)

```
autoadministracion-cabanas/
├── backend/      API REST — controladores, servicios, modelos y tests
└── frontend/     SPA en React — mobile-first
```

Cada carpeta tiene su propio README con las instrucciones de instalación:
[backend](./backend/README.md) · [frontend](./frontend/README.md)

---

## Decisiones de diseño

**Servicios separados de controladores.** Los controladores sólo traducen HTTP; toda la
lógica de negocio vive en `services/`. Eso hace que las reglas —disponibilidad, cálculo
de seña, transiciones de estado— se puedan testear sin levantar un servidor.

**La seña se calcula en el backend.** El frontend manda el porcentaje, nunca el monto.
Si lo mandara, un cliente modificado podría registrar una seña que no corresponde.

**Los estados se recalculan solos.** Una reserva pasa a `Finalizada` cuando vence el
check-out y a `Pagada` cuando los cobros igualan el total. No hay que acordarse de
actualizar nada a mano.

**Un huésped, un DNI.** Cargar a alguien que ya existe actualiza sus datos en lugar de
duplicarlo, y arrastra su historial de visitas y las notas de comportamiento.

---

## Modelo de datos

```
Cabana ──< Reserva >── ReservaHuesped ──< Huesped
              │
              └──< Pago
```

Una reserva pertenece a una cabaña y tiene exactamente un titular más los acompañantes
que hagan falta. Los pagos son parciales: la suma define si la reserva está señada o
saldada.

---

## Reglas de negocio

**Disponibilidad.** Una cabaña está ocupada si existe una reserva `Señada` o `Pagada`
que se solape con el período pedido:

```
se solapan  ⇔  checkIn₁ < checkOut₂  ∧  checkOut₁ > checkIn₂
```

El caso borde importa: si alguien se va el mismo día que entra el siguiente, **no** hay
solapamiento. Es la situación más común en temporada alta y está cubierta por tests.

**Semáforo de cobros.** El color de cada reserva en el calendario resume su estado:

| Color | Significado |
|---|---|
| 🔵 Celeste | Señada, falta más de un día para el check-in |
| 🟡 Amarillo | El check-in es hoy o mañana — hay que cobrar |
| 🟢 Verde | Saldada |
| 🔴 Rojo | Sin ningún cobro todavía, o el check-in ya pasó y queda saldo |
| ⚪ Gris | Finalizada |
| 🟠 Naranja | Abortada |

---

## Seguridad

El sistema guarda datos personales de huéspedes reales —nombre, DNI, domicilio,
teléfono, patente—, así que se trató como corresponde y no como un proyecto de práctica.

- Contraseñas con **bcrypt** (cost 12). No hay endpoint público de registro: los
  usuarios se crean con un script que pide las credenciales por consola sin mostrarlas.
- **JWT** para autenticación. Todas las rutas de la API excepto el login exigen token.
- **Límite de intentos** en el login: 10 cada 15 minutos por IP.
- **CORS** restringido por lista blanca de dominios.
- **Helmet** para cabeceras de seguridad y límite de tamaño en el cuerpo de las peticiones.
- **Validación con Zod** en todos los endpoints de escritura, con lista explícita de
  campos permitidos para evitar *mass assignment*.
- Los errores internos nunca se devuelven al cliente: los stack traces y los mensajes
  crudos del ORM se quedan en el log del servidor.
- Ningún secreto en el repositorio. Toda la configuración sensible va por variables de
  entorno.

---

## Tests

```bash
cd backend && npm test    # 116 tests
cd frontend && npm test   # 38 tests
```

**Backend.** Dos grupos. Sin base: autenticación, validación de entrada, CORS,
cabeceras y límite de intentos. Con base: las reglas de negocio de punta a punta
(disponibilidad, cobros y estados, huéspedes, estadísticas) y las migraciones, contra
un Postgres real y descartable que se levanta solo en una carpeta temporal. Ninguno
puede tocar datos reales.

**Frontend.** La lógica que decide lo que ve la usuaria: el semáforo de cobros, fechas,
montos y el intérprete de mensajes de WhatsApp.

---

## Esquema de la base

Se maneja con migraciones (`backend/src/migraciones/`). El servidor aplica las
pendientes al arrancar y la base registra cuáles ya corrieron. Un test exige que
migraciones y modelos generen exactamente el mismo esquema, y otro verifica que
migrar una base con datos no cambie ningún dato.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).
