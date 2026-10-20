/**
 * Levanta la app en un puerto libre y devuelve una función para hacer pedidos
 * y otra para cerrarla. No toca variables de entorno: eso lo hace ayudas.js
 * (sin base) o conBase.js (con base), que tienen que importarse antes.
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

  return { pedir, cerrar: () => new Promise((resolve) => server.close(resolve)) };
}

export { levantarApp };
