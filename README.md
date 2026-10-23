# Autoadministración de Cabañas

Sistema de gestión de reservas para un complejo de cabañas en Potrero de los Funes,
San Luis. No es un proyecto de práctica: está en producción y lo usa la dueña del
complejo para administrar las reservas, los huéspedes y los cobros.

Ese detalle condicionó cada decisión de diseño. La usuaria trabaja **siempre desde el
celular**, no es técnica, y si algo falla se queda sin poder tomar una reserva. De ahí
que la interfaz sea mobile-first y que la información crítica —cuánto falta cobrar,
qué cabaña está libre— se lea de un vistazo, sin menús ni pasos intermedios.

---

## Qué resuelve

Antes el control se llevaba en papel y en notas del teléfono. Los problemas concretos
que aparecían eran cuatro:

- **Sobreventa.** Dos reservas superpuestas en la misma cabaña.
- **Cobros perdidos.** Señas cobradas a medias, sin registro de cuánto faltaba.
- **Huéspedes repetidos.** Volver a pedir todos los datos a alguien que ya se había alojado.
- **Carga tediosa.** Los huéspedes mandan sus datos en un mensaje de WhatsApp, y pasarlos
  campo por campo a la planilla llevaba tiempo y generaba errores.

El sistema ataca los cuatro: valida disponibilidad antes de confirmar, lleva el saldo
de cada reserva con un semáforo de colores, autocompleta los datos del huésped a partir
del DNI, e interpreta el mensaje del huésped para cargar todos sus datos de una vez.

---

## Funcionalidades

- **Resumen del día** al abrir la app: quién entra y quién sale hoy y mañana en todas
  las cabañas, y a quién falta cobrarle.
- **Calendario mensual** por cabaña, con el estado de cobro de cada reserva por color y
  la agenda del día elegido.
- **Alta de reservas** con validación de disponibilidad, cálculo de seña y opción de
  extender una estadía con el mismo titular.
- **Carga rápida de huéspedes:** se pega el mensaje que mandó el cliente y el sistema
  completa nombre, apellido, DNI, CUIL, teléfono, domicilio, vehículo y patente de
  cada persona (ver más abajo).
- **Autocompletado por DNI:** un huésped que ya vino aparece con sus datos y las notas
  de comportamiento de visitas anteriores.
- **Cobros parciales** en efectivo o transferencia, con el saldo al día y cambio de
  estado automático.
- **Contacto por WhatsApp** con el titular, con un mensaje ya escrito.
- **Historial** de reservas finalizadas y canceladas, e **informes mensuales** de caja,
  ocupación y rendimiento por cabaña.

---

## Stack

**Backend** — Node.js · Express · Sequelize · PostgreSQL (Supabase) · JWT · Zod · Umzug
**Frontend** — React · Vite · Tailwind CSS v4 · React Router · Axios
**Infraestructura** — Render (API) · Vercel (frontend) · GitHub Actions

```
autoadministracion-cabanas/
├── backend/             API REST: controladores, servicios, modelos, migraciones y tests
├── frontend/            SPA en React, mobile-first
└── .github/workflows/   chequeo periódico del backend en producción
```

Cada carpeta tiene su propio README con las instrucciones de instalación:
[backend](./backend/README.md) · [frontend](./frontend/README.md)

---

## Decisiones de diseño

**Servicios separados de controladores.** Los controladores sólo traducen HTTP; toda la
lógica de negocio vive en `services/`. Eso hace que las reglas —disponibilidad, cálculo
de seña, transiciones de estado— se puedan testear sin depender de la capa HTTP.

**La seña se calcula en el backend.** El frontend manda el porcentaje, nunca el monto.
Si lo mandara, un cliente modificado podría registrar una seña que no corresponde.

**Los estados se recalculan solos.** Una reserva pasa a `Finalizada` cuando vence el
check-out y a `Pagada` cuando los cobros igualan el total. No hay que acordarse de
actualizar nada a mano.

**Un huésped, un DNI.** Cargar a alguien que ya existe actualiza sus datos en lugar de
duplicarlo, y conserva su historial de visitas y las notas de comportamiento.

**Una sola fuente para cada cálculo.** El color de una reserva, su saldo y el formato
de los montos salen siempre del mismo módulo, con tests, así ninguna pantalla
contradice a otra.

---

## Carga rápida a partir del mensaje del huésped

Los datos llegan como texto libre, por ejemplo:

> Norma Graciela Berger dni 17047028. Cuil 27170470287. Florisbelo Acosta 3766 MdP.
> Toyota Hilux blanca 2013, NJU 953. Marcelo O Giangreco 16572628.

El intérprete ([`interpretarMensaje.js`](./frontend/src/utils/interpretarMensaje.js))
lo convierte en un titular con todos sus datos y un acompañante. Funciona **sin IA ni
servicios externos**, con reglas sobre los formatos argentinos, en dos etapas:

1. **Datos con forma reconocible**, estén donde estén: DNI de 7 u 8 dígitos, CUIL con
   su dígito verificador, teléfonos, patentes del formato viejo y Mercosur.
2. **El resto del texto**, cortado en trozos y clasificado: nombre, domicilio
   (con abreviaturas de ciudades como *MdP* o *CABA*), vehículo (por marca o modelo)
   o texto de relleno ("Hola, te paso los datos").

Un nombre pegado a un DNI es un huésped; el primero es el titular. El intérprete
**nunca inventa datos**: lo que no reconoce queda vacío y genera un aviso, y nada se
guarda sin pasar por una pantalla de revisión donde se puede corregir cada campo.
Además cruza los datos entre sí: avisa si el CUIL no corresponde al DNI.

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
| 🟡 Amarillo | El check-in es hoy o mañana: hay que cobrar |
| 🟢 Verde | Saldada |
| 🔴 Rojo | Sin ningún cobro todavía, o el check-in ya pasó y queda saldo |
| ⚪ Gris | Finalizada |
| 🟠 Naranja | Cancelada |

**Fechas en hora de Argentina.** El servidor corre en UTC, pero "hoy" es siempre el día
en el complejo: un cobro registrado a las 22 h queda con la fecha correcta y suma en
el mes que corresponde.

---

## Seguridad

El sistema guarda datos personales de huéspedes reales —nombre, DNI, domicilio,
teléfono, patente—, así que se los trata con el cuidado que corresponde.

- Contraseñas con **bcrypt** (cost 12). No hay endpoint público de registro: los
  usuarios se crean con un script que pide las credenciales por consola sin mostrarlas.
- **JWT** para autenticación. Todas las rutas de la API exigen token, salvo el login
  y los chequeos de salud.
- **Límite de intentos** en el login: 10 cada 15 minutos por IP.
- **CORS** restringido por lista blanca de dominios.
- **Helmet** para cabeceras de seguridad y límite de tamaño en el cuerpo de las peticiones.
- **Validación con Zod** en todos los endpoints, con lista explícita de campos
  permitidos para evitar *mass assignment*.
- Los errores internos nunca se devuelven al cliente: los stack traces y los mensajes
  del ORM se quedan en el log del servidor.
- Ningún secreto en el repositorio: toda la configuración sensible va por variables
  de entorno.

---

## Operación en producción

El backend y la base corren en planes gratuitos (Render y Supabase), con dos
limitaciones que el sistema tiene en cuenta:

- **Render apaga el servidor tras 15 minutos sin uso** y tarda hasta un minuto en
  volver. La pantalla de ingreso avisa cuando eso pasa, y el cliente HTTP espera lo
  necesario antes de dar error.
- **Supabase pausa la base tras una semana sin actividad**, y con la base pausada el
  backend no puede arrancar. Un workflow de GitHub Actions
  ([`mantener-activo.yml`](./.github/workflows/mantener-activo.yml)) consulta cada dos
  días el endpoint `/api/health/db`, que hace una consulta real a la base: eso la
  mantiene activa, y si el chequeo falla, GitHub avisa por mail.

Al arrancar, el servidor reintenta la conexión a la base con esperas crecientes antes
de darse por vencido, para que una falla pasajera no lo deje caído.

---

## Tests

```bash
cd backend && npm test    # 122 tests
cd frontend && npm test   # 56 tests
```

**Backend.** Dos grupos. Sin base: autenticación, validación de entrada, CORS,
cabeceras, límite de intentos y reintentos de conexión. Con base: las reglas de negocio
de punta a punta (disponibilidad, cobros y estados, huéspedes, estadísticas) y las
migraciones, contra un Postgres real y descartable que se levanta solo en una carpeta
temporal. Ninguno puede tocar datos reales.

**Frontend.** La lógica que decide lo que ve la usuaria: el semáforo de cobros, fechas,
montos, el link de WhatsApp y el intérprete de mensajes, probado con mensajes reales
en distintos formatos.

---

## Esquema de la base

Se maneja con migraciones (`backend/src/migraciones/`). El servidor aplica las
pendientes al arrancar y la base registra cuáles ya corrieron. Un test exige que
migraciones y modelos generen exactamente el mismo esquema, y otro verifica que
migrar una base con datos no cambie ningún dato.

---

## Licencia

MIT. Ver [LICENSE](./LICENSE).
