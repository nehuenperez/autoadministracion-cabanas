/**
 * Manejador central de errores.
 *
 * Sólo se devuelve al cliente el mensaje de los errores de negocio (los que
 * llevan un `status` propio). Cualquier otra cosa —fallas de Sequelize, bugs,
 * errores de conexión— se responde como un 500 genérico: los detalles internos
 * y los stack traces se quedan en el log del servidor y nunca viajan en la
 * respuesta.
 */
function manejadorDeErrores(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error capturado:', err.message);
  }

  const status = err.status || 500;
  const mensaje = err.status ? err.message : 'Error interno del servidor';

  res.status(status).json({ error: mensaje });
}

export { manejadorDeErrores };
