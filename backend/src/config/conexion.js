/**
 * Conexión a la base al arrancar, con reintentos.
 *
 * Una falla pasajera (un corte de red, la base tardando en responder después
 * de estar inactiva) no debe cerrar el servidor: si se cerrara, Render lo daría
 * por caído. Se espera y se vuelve a probar, cada vez un poco más, y sólo se
 * abandona si la base sigue sin responder después de todos los intentos
 * (alrededor de un minuto y medio con los valores por defecto).
 */

const ESPERAS_POR_DEFECTO = [2000, 4000, 8000, 15000, 30000, 30000];

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function conectarConReintentos(sequelize, { esperas = ESPERAS_POR_DEFECTO, avisar = console.warn } = {}) {
  for (let intento = 0; ; intento++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (error) {
      if (intento >= esperas.length) throw error;
      const espera = esperas[intento];
      avisar(
        `⚠️  No se pudo conectar a la base (intento ${intento + 1} de ${esperas.length + 1}): ${error.message}. ` +
          `Reintentando en ${espera / 1000} s...`
      );
      await dormir(espera);
    }
  }
}

export { conectarConReintentos };
