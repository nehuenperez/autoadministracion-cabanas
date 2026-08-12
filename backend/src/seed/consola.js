import readline from 'node:readline';

/**
 * Helpers de consola compartidos por los scripts de seed.
 *
 * La razón de existir de este archivo es que las contraseñas nunca se escriben
 * en el código ni se pasan por argumentos (quedarían en el historial de la
 * terminal): se piden por consola y no se muestran mientras se tipean.
 */

function crearInterfaz() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function preguntar(rl, texto) {
  return new Promise((resolve) => rl.question(texto, (respuesta) => resolve(respuesta.trim())));
}

/**
 * Igual que preguntar(), pero no muestra en pantalla lo que se tipea.
 * Evita que la contraseña quede visible si hay alguien mirando o si se
 * comparte una captura de la terminal.
 */
function preguntarOculto(rl, texto) {
  return new Promise((resolve) => {
    let silenciar = false;

    rl._writeToOutput = function (cadena) {
      if (silenciar) {
        // Redibuja sólo el prompt, sin los caracteres tipeados
        if (cadena.includes(texto)) rl.output.write(texto);
        return;
      }
      rl.output.write(cadena);
    };

    rl.question(texto, (respuesta) => {
      silenciar = false;
      rl.output.write('\n');
      resolve(respuesta.trim());
    });

    silenciar = true;
  });
}

const LARGO_MINIMO_PASSWORD = 12;

/**
 * Pide una contraseña dos veces y valida que coincidan y que tenga
 * un largo razonable. Devuelve la contraseña en texto plano, que el
 * llamador debe hashear inmediatamente y nunca loguear.
 */
async function pedirPasswordConfirmada(rl, textoInicial = 'Contraseña: ') {
  const password = await preguntarOculto(rl, textoInicial);

  if (password.length < LARGO_MINIMO_PASSWORD) {
    throw new Error(`La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`);
  }

  const confirmacion = await preguntarOculto(rl, 'Repetir contraseña: ');

  if (password !== confirmacion) {
    throw new Error('Las contraseñas no coinciden.');
  }

  return password;
}

export { crearInterfaz, preguntar, preguntarOculto, pedirPasswordConfirmada, LARGO_MINIMO_PASSWORD };
