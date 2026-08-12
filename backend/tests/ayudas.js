/**
 * Preparación común para los tests.
 *
 * IMPORTANTE: este módulo tiene que importarse ANTES que cualquier cosa que
 * termine cargando la configuración de la base. Pisa DATABASE_URL con una
 * dirección que no existe, de modo que si un test tocara sin querer un endpoint
 * que consulta la base, falle por timeout en vez de pegarle a producción.
 *
 * Los tests de esta carpeta cubren a propósito todo lo que se resuelve ANTES de
 * llegar a la base: autenticación, validación de entrada, CORS, cabeceras y
 * límite de intentos. Es justamente la capa donde estaba el bug de login.
 */

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/basededatosinexistente';
process.env.JWT_SECRET = 'secreto-solo-para-tests-con-largo-suficiente-1234567890';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGINS = 'https://ejemplo-produccion.vercel.app,http://localhost:5173';

const { default: jwt } = await import('jsonwebtoken');

/** Token válido, como el que emite el login. */
function tokenValido(payload = { id: 1, nombreUsuario: 'usuarioDePrueba' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/** Token firmado con otra clave: simula uno falsificado. */
function tokenConFirmaInvalida() {
  return jwt.sign({ id: 1, nombreUsuario: 'intruso' }, 'clave-equivocada', { expiresIn: '1h' });
}

/** Token bien firmado pero ya vencido. */
function tokenVencido() {
  return jwt.sign({ id: 1, nombreUsuario: 'usuarioDePrueba' }, process.env.JWT_SECRET, {
    expiresIn: '-1h',
  });
}

/**
 * Levanta la app en un puerto libre y devuelve una función para hacer pedidos
 * y otra para cerrarla.
 */
async function levantarApp() {
  const { default: app } = await import('../src/app.js');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  async function pedir(ruta, opciones = {}) {
    const { token, cuerpo, metodo = 'GET', cabeceras = {} } = opciones;

    const respuesta = await fetch(`http://127.0.0.1:${port}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...cabeceras,
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });

    const texto = await respuesta.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {
      // algunas respuestas no son JSON (por ejemplo errores de CORS)
    }

    return { status: respuesta.status, json, texto, headers: respuesta.headers };
  }

  return { pedir, cerrar: () => server.close() };
}

export { levantarApp, tokenValido, tokenConFirmaInvalida, tokenVencido };
