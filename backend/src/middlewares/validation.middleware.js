import { z } from 'zod';

/**
 * Validación y saneamiento de todo lo que entra por la API.
 *
 * Dos motivos para que esto exista:
 *
 * 1. Seguridad. Los controladores pasaban `req.body` crudo a los servicios y de
 *    ahí a Sequelize. Sin una lista explícita de campos permitidos, un cliente
 *    podía mandar propiedades de más y escribir columnas que no le corresponden
 *    (mass assignment). Los esquemas de acá descartan todo lo que no esté
 *    declarado.
 *
 * 2. Mensajes de error claros. Antes, un dato con el tipo equivocado llegaba
 *    hasta la base y volvía como un 500 genérico. Ahora se corta en la puerta
 *    con un 400 que dice qué campo está mal.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fecha en formato YYYY-MM-DD que además exista de verdad (rechaza 2025-02-31). */
const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'debe tener formato AAAA-MM-DD')
  .refine((valor) => {
    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return (
      fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia
    );
  }, 'no es una fecha válida');

/** Acepta número o string numérico (los formularios HTML mandan strings). */
const numero = z.coerce.number({ message: 'debe ser un número' }).finite('debe ser un número válido');

const idPositivo = z.coerce
  .number({ message: 'debe ser un número' })
  .int('debe ser un número entero')
  .positive('debe ser mayor a 0');

const textoOpcional = z.string().trim().max(500).optional().nullable();

// ── Esquemas ───────────────────────────────────────────────────────────────

const esquemas = {
  login: z.object({
    nombreUsuario: z.string().trim().min(1, 'es obligatorio').max(100),
    password: z.string().min(1, 'es obligatoria').max(200),
  }),

  crearReserva: z.object({
    cabanaId: idPositivo,
    fechaCheckIn: fechaISO,
    fechaCheckOut: fechaISO,
    montoTotal: numero.nonnegative('no puede ser negativo'),
    porcentajeSena: numero.min(0).max(100, 'debe estar entre 0 y 100').optional(),
  }),

  // En la edición todos los campos son opcionales: el servicio completa
  // los que no vengan con los valores actuales de la reserva.
  editarReserva: z
    .object({
      cabanaId: idPositivo.optional(),
      fechaCheckIn: fechaISO.optional(),
      fechaCheckOut: fechaISO.optional(),
      montoTotal: numero.nonnegative('no puede ser negativo').optional(),
      porcentajeSena: numero.min(0).max(100, 'debe estar entre 0 y 100').optional(),
    })
    .refine((datos) => Object.keys(datos).length > 0, {
      message: 'No se envió ningún campo para actualizar',
    }),

  crearPago: z.object({
    monto: numero.positive('debe ser mayor a 0'),
    metodoPago: z.enum(['Efectivo', 'Transferencia'], {
      message: 'debe ser "Efectivo" o "Transferencia"',
    }),
    fecha: fechaISO.optional(),
  }),

  crearHuesped: z.object({
    nombre: z.string().trim().min(1, 'es obligatorio').max(100),
    apellido: z.string().trim().min(1, 'es obligatorio').max(100),
    // Se deja flexible a propósito: puede ser DNI, pasaporte o documento extranjero.
    dni: z.string().trim().min(1, 'es obligatorio').max(20),
    telefono: textoOpcional,
    direccion: textoOpcional,
    vehiculoModelo: textoOpcional,
    vehiculoPatente: textoOpcional,
    notasComportamiento: textoOpcional,
  }),

  actualizarNotas: z.object({
    notasComportamiento: z.string().trim().max(2000).nullable(),
  }),

  vincularHuespedes: z.object({
    huespedes: z
      .array(
        // El frontend manda el huésped entero. z.object() descarta en silencio
        // las claves que no estén declaradas, así que sólo sobreviven estas dos.
        z.object({
          huespedId: idPositivo,
          rol: z.enum(['titular', 'acompañante'], {
            message: 'debe ser "titular" o "acompañante"',
          }),
        })
      )
      .min(1, 'debe incluir al menos un huésped'),
  }),

  paramId: z.object({ id: idPositivo }),
  paramReservaId: z.object({ reservaId: idPositivo }),
  paramDni: z.object({ dni: z.string().trim().min(1).max(20) }),

  queryEstadisticas: z.object({
    mes: z.coerce.number().int().min(1).max(12).optional(),
    anio: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
};

// ── Middlewares ────────────────────────────────────────────────────────────

/** Convierte los errores de zod en un mensaje legible: 'campo: motivo'. */
function formatearError(error) {
  return error.issues
    .map((issue) => {
      const campo = issue.path.join('.');
      return campo ? `${campo}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

function validar(origen, nombreEsquema) {
  const esquema = esquemas[nombreEsquema];

  if (!esquema) {
    throw new Error(`No existe el esquema de validación "${nombreEsquema}"`);
  }

  return function middlewareDeValidacion(req, res, next) {
    const resultado = esquema.safeParse(req[origen]);

    if (!resultado.success) {
      return res.status(400).json({ error: formatearError(resultado.error) });
    }

    // Se reemplaza por la versión saneada: sin campos de más y con los
    // tipos ya convertidos (por ejemplo "5" -> 5).
    if (origen === 'body') {
      req.body = resultado.data;
    } else {
      req.datosValidados = { ...(req.datosValidados || {}), ...resultado.data };
    }

    next();
  };
}

const validarBody = (nombreEsquema) => validar('body', nombreEsquema);
const validarParams = (nombreEsquema) => validar('params', nombreEsquema);
const validarQuery = (nombreEsquema) => validar('query', nombreEsquema);

export { validarBody, validarParams, validarQuery, esquemas };
