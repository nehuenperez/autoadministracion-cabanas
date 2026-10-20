/**
 * Postgres real y descartable para los tests que necesitan base de datos.
 *
 * Usa los binarios que trae la dependencia `embedded-postgres` (initdb y
 * pg_ctl), crea un cluster en una carpeta temporal, lo levanta en un puerto
 * libre y lo borra al terminar. Nunca se conecta a otra base que no sea esa:
 * es imposible que un test toque los datos de producción.
 *
 * Se arranca con pg_ctl y no con postgres directamente porque en Windows
 * Postgres se niega a correr con un usuario administrador, y pg_ctl se
 * encarga de bajarle los permisos antes de lanzarlo.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const PLATAFORMAS = { win32: 'windows', darwin: 'darwin', linux: 'linux' };

async function binarios() {
  const plataforma = PLATAFORMAS[os.platform()];
  if (!plataforma) throw new Error(`Plataforma no soportada: ${os.platform()}`);
  return import(`@embedded-postgres/${plataforma}-${os.arch()}`);
}

function puertoLibre() {
  return new Promise((resolve, reject) => {
    const servidor = net.createServer();
    servidor.unref();
    servidor.on('error', reject);
    servidor.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address();
      servidor.close(() => resolve(port));
    });
  });
}

// stdio 'ignore': si el proceso hijo hereda la salida, en Windows pg_ctl deja
// el pipe abierto (lo hereda el servidor) y el comando nunca termina.
function ejecutar(binario, argumentos) {
  return new Promise((resolve, reject) => {
    const proceso = spawn(binario, argumentos, { stdio: 'ignore', windowsHide: true });
    proceso.on('error', reject);
    proceso.on('exit', (codigo) => {
      if (codigo === 0) return resolve();
      // 0xC0000135: falta una DLL. En Windows es el runtime de Visual C++.
      const pista = codigo === 3221225781
        ? ' Falta el runtime de Visual C++: instalá "Microsoft Visual C++ Redistributable (x64)".'
        : '';
      reject(new Error(`${path.basename(binario)} terminó con código ${codigo}.${pista}`));
    });
  });
}

/**
 * Levanta el Postgres de prueba y devuelve la URL de conexión y una función
 * para apagarlo y borrar todo.
 */
async function levantarPostgres() {
  const { initdb, pg_ctl } = await binarios();
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'cabanas-test-pg-'));
  const datos = path.join(carpeta, 'datos');
  const log = path.join(carpeta, 'postgres.log');
  const puerto = await puertoLibre();

  let apagado = false;
  const apagar = async () => {
    if (apagado) return;
    apagado = true;
    try {
      await ejecutar(pg_ctl, ['stop', '-D', datos, '-m', 'immediate', '-w']);
    } catch {
      // ya estaba apagado
    }
    fs.rmSync(carpeta, { recursive: true, force: true });
  };

  // Red de seguridad: si el proceso de tests termina sin llamar a apagar()
  // (un error no capturado, un Ctrl+C), no queda un Postgres huérfano.
  process.once('exit', () => {
    if (apagado) return;
    spawnSync(pg_ctl, ['stop', '-D', datos, '-m', 'immediate'], { stdio: 'ignore', windowsHide: true });
    fs.rmSync(carpeta, { recursive: true, force: true });
  });

  try {
    await ejecutar(initdb, ['-D', datos, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C']);
    await ejecutar(pg_ctl, [
      'start', '-D', datos, '-w', '-l', log,
      '-o', `-p ${puerto} -c listen_addresses=127.0.0.1 -c fsync=off`,
    ]);
  } catch (error) {
    const detalle = fs.existsSync(log) ? `\n${fs.readFileSync(log, 'utf8')}` : '';
    await apagar();
    throw new Error(`No se pudo levantar el Postgres de prueba: ${error.message}${detalle}`);
  }

  return { url: `postgres://postgres@127.0.0.1:${puerto}/postgres`, apagar };
}

export { levantarPostgres };
