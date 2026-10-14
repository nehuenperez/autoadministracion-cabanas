/**
 * Interpreta el mensaje de texto libre que manda un huésped (por WhatsApp, por
 * ejemplo) y lo convierte en una lista de huéspedes con sus campos cargados.
 *
 *   "Norma Graciela Berger dni 17047028. Cuil 27170470287. Florisbelo Acosta
 *    3766 MdP. Toyota Hilux blanca 2013, NJU 953. Marcelo O Giangreco 16572628."
 *
 * No usa IA ni servicios externos: son reglas fijas sobre los formatos
 * argentinos (DNI de 7-8 dígitos, CUIL con dígito verificador, patentes vieja y
 * Mercosur, etc.). Funciona en dos etapas:
 *
 * 1. Datos "fuertes": los que se reconocen por su forma sin importar dónde
 *    estén (CUIL, teléfono, DNI, patente). Se detectan con expresiones regulares
 *    sobre todo el texto y se marcan como usados.
 * 2. Lo que queda se corta en trozos (por puntos, comas, saltos de línea y
 *    etiquetas como "Domicilio:") y cada trozo se clasifica: nombre, domicilio,
 *    vehículo, ciudad o texto de relleno.
 *
 * Después se arman las personas: un nombre pegado a un DNI es un huésped; el
 * primero es el titular y el resto, acompañantes.
 *
 * Nunca inventa datos: lo que no reconoce queda vacío y genera un aviso para
 * que se revise antes de guardar.
 */

// ── Utilidades de texto ────────────────────────────────────────────────────

/**
 * Saca tildes y diéresis SIN cambiar el largo del texto, así las posiciones
 * encontradas en la versión "plana" valen también para el texto original.
 */
function sinAcentos(texto) {
  return texto.replace(/[^\x20-\x7E\n\t]/g, (c) => c.normalize('NFD')[0]);
}

function clave(texto) {
  return sinAcentos(texto.toLowerCase()).replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function capitalizarPrimera(texto) {
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);
}

function soloDigitos(texto) {
  return String(texto).replace(/\D/g, '');
}

// ── CUIL ───────────────────────────────────────────────────────────────────

const PREFIJOS_CUIL = ['20', '23', '24', '27', '30', '33', '34'];

/** Valida el dígito verificador de un CUIL/CUIT (algoritmo de módulo 11 de AFIP). */
function cuilValido(cuil) {
  const digitos = soloDigitos(cuil);
  if (digitos.length !== 11 || !PREFIJOS_CUIL.includes(digitos.slice(0, 2))) return false;

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acum, peso, i) => acum + peso * Number(digitos[i]), 0);
  const resto = 11 - (suma % 11);
  if (resto === 10) return false; // AFIP no emite CUIL con este resultado
  const verificador = resto === 11 ? 0 : resto;
  return verificador === Number(digitos[10]);
}

function formatearCuil(cuil) {
  const d = soloDigitos(cuil);
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** El DNI está "adentro" del CUIL: 27-17047028-7 → 17047028. */
function dniDelCuil(cuil) {
  return soloDigitos(cuil).slice(2, 10).replace(/^0+/, '');
}

// ── Diccionarios ───────────────────────────────────────────────────────────

const CIUDADES = {
  mdp: 'Mar del Plata',
  'mar del plata': 'Mar del Plata',
  caba: 'CABA',
  'capital federal': 'Capital Federal',
  'cap fed': 'Capital Federal',
  'bs as': 'Buenos Aires',
  bsas: 'Buenos Aires',
  'buenos aires': 'Buenos Aires',
  'pcia de bs as': 'Provincia de Buenos Aires',
  cba: 'Córdoba',
  cordoba: 'Córdoba',
  mza: 'Mendoza',
  mendoza: 'Mendoza',
  rosario: 'Rosario',
  'san luis': 'San Luis',
  vm: 'Villa Mercedes',
  'villa mercedes': 'Villa Mercedes',
  'v mercedes': 'Villa Mercedes',
  'la plata': 'La Plata',
  'bahia blanca': 'Bahía Blanca',
  tucuman: 'Tucumán',
  tuc: 'Tucumán',
  neuquen: 'Neuquén',
  nqn: 'Neuquén',
  'santa fe': 'Santa Fe',
  'sta fe': 'Santa Fe',
  salta: 'Salta',
  'san juan': 'San Juan',
  'rio cuarto': 'Río Cuarto',
  'rio iv': 'Río Cuarto',
  'villa carlos paz': 'Villa Carlos Paz',
  'carlos paz': 'Villa Carlos Paz',
  vcp: 'Villa Carlos Paz',
  merlo: 'Merlo',
  'potrero de los funes': 'Potrero de los Funes',
  'juana koslay': 'Juana Koslay',
  'la punta': 'La Punta',
  parana: 'Paraná',
  corrientes: 'Corrientes',
  posadas: 'Posadas',
  resistencia: 'Resistencia',
  jujuy: 'Jujuy',
  'san rafael': 'San Rafael',
  tandil: 'Tandil',
  quilmes: 'Quilmes',
  'lomas de zamora': 'Lomas de Zamora',
  moron: 'Morón',
  'san isidro': 'San Isidro',
  tigre: 'Tigre',
  pilar: 'Pilar',
  lanus: 'Lanús',
  avellaneda: 'Avellaneda',
  necochea: 'Necochea',
  'villa maria': 'Villa María',
  'san nicolas': 'San Nicolás',
  'venado tuerto': 'Venado Tuerto',
  'santa rosa': 'Santa Rosa',
  'godoy cruz': 'Godoy Cruz',
};

function buscarCiudad(texto) {
  return CIUDADES[clave(texto)] || null;
}

// Marcas y modelos que alcanzan por sí solos para reconocer un vehículo.
// Se dejan afuera los que son palabras comunes o nombres de persona
// ("Fiesta", "Uno", "Polo", "Toro", "Mercedes"...): esos se reconocen igual
// cuando vienen después de la marca ("Ford Fiesta").
const VEHICULOS = [
  // marcas
  'toyota', 'ford', 'chevrolet', 'volkswagen', 'vw', 'fiat', 'renault', 'peugeot',
  'citroen', 'honda', 'nissan', 'jeep', 'kia', 'hyundai', 'chery', 'suzuki',
  'mitsubishi', 'audi', 'bmw', 'dodge', 'subaru', 'mazda', 'baic', 'haval', 'volvo',
  'land rover', 'iveco', 'geely', 'jac', 'lifan', 'great wall', 'byd', 'jetour',
  'changan', 'alfa romeo', 'porsche', 'skoda', 'dfsk', 'foton', 'chrysler', 'lexus',
  'isuzu', 'ssangyong', 'opel', 'mercedes[ -]benz',
  // modelos
  'hilux', 'sw4', 'etios', 'corolla', 'yaris', 'rav4', 'amarok', 'gol', 'vento',
  'virtus', 'suran', 'saveiro', 'taos', 't-cross', 'nivus', 'tiguan', 'bora', 'golf',
  'passat', 'voyage', 'corsa', 'onix', 'prisma', 'cruze', 's10', 'tracker', 'agile',
  'ranger', 'ecosport', 'territory', 'maverick', 'kuga', 'kangoo', 'duster', 'sandero',
  'logan', 'clio', 'kwid', 'symbol', 'stepway', 'oroch', 'alaskan', 'koleos', 'captur',
  'kardian', 'megane', 'fluence', 'cronos', 'palio', 'siena', 'mobi', 'argo', 'pulse',
  'fastback', 'strada', 'fiorino', 'ducato', 'frontier', 'kicks', 'versa', 'sentra',
  'tiida', 'hr-v', 'cr-v', 'wr-v', 'renegade', 'compass', 'wrangler', 'sprinter',
  'vito', 'tucson', 'creta', 'hb20', 'sportage', 'cerato', 'berlingo',
  // "Mercedes" sólo cuenta como marca si viene seguida de un modelo; si no,
  // es un nombre de persona o "Villa Mercedes".
  'mercedes(?=[ -]+(?:benz|sprinter|vito|clase|gl[abce]|ml)\\b)',
];
const REGEX_VEHICULO = new RegExp(`\\b(?:${VEHICULOS.join('|')})\\b`, 'i');

const COLORES = new Set([
  'blanco', 'blanca', 'negro', 'negra', 'gris', 'rojo', 'roja', 'azul', 'plata',
  'plateado', 'plateada', 'verde', 'bordo', 'beige', 'dorado', 'dorada', 'celeste',
  'marron', 'naranja', 'amarillo', 'amarilla', 'champagne', 'grafito', 'violeta',
  'bronce', 'oscuro', 'oscura', 'claro', 'clara', 'metalizado', 'metalizada',
  'color', 'modelo', 'ano', 'mod',
]);

const DIAS_Y_MESES = new Set([
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'setiembre', 'octubre', 'noviembre', 'diciembre',
]);

// Palabras que preceden a una calle aunque esté escrita en minúscula.
const REGEX_CALLE = /\b(?:calle|av|avda|avenida|bv|boulevard|bulevar|pje|pasaje|ruta|diagonal|diag|camino|barrio|lote|mz|manzana)\b/i;

// Lo que viene después de una dirección y la completa (piso, depto, código postal...).
const REGEX_COMPLEMENTO_DIRECCION = /^(?:piso|dpto|depto|departamento|dto|casa|torre|block|unidad|uf|cp|c p|codigo postal)\b/i;

/**
 * Palabras de relleno: saludos, conectores y parentescos. Se descartan al
 * principio de un trozo ("Viene con su esposo Raúl Fernández" → "Raúl
 * Fernández") y un trozo hecho sólo de estas palabras se ignora en silencio.
 */
const RELLENO = new Set([
  'hola', 'buenas', 'buen', 'buenos', 'dia', 'dias', 'tardes', 'noches', 'gracias',
  'muchas', 'saludos', 'saludo', 'abrazo', 'besos', 'beso', 'te', 'le', 'les', 'paso',
  'pasamos', 'envio', 'mando', 'los', 'las', 'el', 'la', 'lo', 'de', 'del', 'al',
  'datos', 'dato', 'son', 'estos', 'estas', 'aca', 'aqui', 'van', 'va', 'mis', 'mi',
  'su', 'sus', 'nuestros', 'nuestras', 'para', 'por', 'reserva', 'ok', 'dale',
  'perfecto', 'bien', 'que', 'tal', 'como', 'cordiales', 'atentamente', 'y', 'e',
  'con', 'mas', 'total', 'sena', 'a', 'en', 'quedamos', 'atentos', 'genial', 'listo',
  'ahi', 'estan', 'todo', 'todos', 'somos', 'junto', 'tambien', 'ademas', 'otro',
  'otra', 'viene', 'vienen', 'viaja', 'viajan', 'llega', 'llegan', 'esposo', 'esposa',
  'marido', 'mujer', 'pareja', 'hijo', 'hija', 'hijos', 'hijas', 'novio', 'novia',
  'amigo', 'amiga', 'amigos', 'amigas', 'hermano', 'hermana', 'madre', 'padre',
  'mama', 'papa', 'suegro', 'suegra', 'nieto', 'nieta', 'senora', 'senor', 'sr', 'sra',
  'nene', 'nena', 'bebe', 'vamos', 'un', 'una', 'personas', 'adultos', 'menores',
]);

// Abreviaturas que llevan punto sin terminar la oración ("Av. Colón", "Bs. As.").
const ABREVIATURAS = new Set([
  'av', 'avda', 'bv', 'gral', 'pje', 'dr', 'dra', 'sta', 'sto', 'pte', 'bs', 'as',
  'cap', 'fed', 'nro', 'dpto', 'depto', 'dto', 'pb', 'esq', 'cnel', 'tte', 'prof',
  'ing', 'pcia', 'prov', 'mz', 'mzna', 'int', 'km', 'sr', 'sra', 'mod', 'n',
]);

// Etiquetas que anuncian qué viene después ("Domicilio: ...", "Auto: ...").
// El orden importa: a igual posición gana la primera que coincida.
const ETIQUETAS = [
  ['apellidoPrimero', 'apellidos? y nombres?'],
  ['persona', 'nombres? y apellidos?|nombre completo|a nombre de|titular(?: de la reserva)?|acompanantes?|acompanad[oa]s? (?:por|de)|huespedes?|pasajer[oa]s?'],
  ['soloNombre', 'nombres?'],
  ['soloApellido', 'apellidos?'],
  ['direccion', 'domicilio|direccion|domiciliad[oa]s? en|viven? en|residen? en'],
  ['vehiculo', 'vehiculo|automovil|auto|camioneta|coche|rodado|utilitario'],
];
const REGEX_ETIQUETAS = new RegExp(
  ETIQUETAS.map(([tipo, patron]) => `(?<${tipo}>\\b(?:${patron})\\b)`).join('|') + '\\s*:?',
  'gi'
);

// ── Etapa 0: normalización ─────────────────────────────────────────────────

function normalizar(mensaje) {
  return String(mensaje || '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // caracteres invisibles que agrega WhatsApp
    // Encabezado de un mensaje reenviado: "[12/10 14:32] Juan: ..."
    .replace(/^\[[^\]\n]*\][^:\n]{0,40}:\s*/gm, '')
    .replace(/[*_~•]/g, ' ') // formato de WhatsApp (*negrita*, _cursiva_) y viñetas
    .replace(/(\s)[-–—](\s)/g, '$1\n$2') // " - " separa datos
    .replace(/\b(\d{1,2})\.(\d{3})\.(\d{3})\b/g, '$1$2$3') // DNI con puntos: 17.047.028
    // CUIL con separadores: 27-17047028-7 / 27 17047028 7
    .replace(/\b(\d{2})([\s.-])(\d{7,8})\2(\d)\b/g, (completo, prefijo, separador, medio, verificador) => {
      const unido = prefijo + medio.padStart(8, '0') + verificador;
      const confiable = separador === '-' || cuilValido(unido);
      return PREFIJOS_CUIL.includes(prefijo) && confiable ? unido : completo;
    })
    .replace(/[ \t]+/g, ' ');
}

// ── Etapa 1: datos fuertes ─────────────────────────────────────────────────

const N_ROTULO = '(?:n(?:ro|°|º|umero)?\\.?\\s*)?'; // "Nro.", "N°", "número"

function pareceTelefono(crudo) {
  const grupos = crudo.split(/[ -]+/).filter(Boolean);
  if (grupos.length === 1 && grupos[0].length === 11 && cuilValido(grupos[0])) return false;
  // Un DNI pegado a otro número no es un teléfono
  if (grupos.length > 1 && grupos[0].length >= 7) return false;

  const digitos = grupos.filter((g, i) => !(i > 0 && g === '15')).join('');
  return (
    (digitos.length === 10 && digitos[0] !== '0') ||
    (digitos.length === 11 && digitos[0] === '0') ||
    (digitos.length === 12 && digitos.startsWith('54')) ||
    (digitos.length === 13 && digitos.startsWith('549'))
  );
}

function formatearPatente(texto) {
  return texto.toUpperCase().replace(/[\s-]/g, '');
}

const EXCLUIDAS_PATENTE_VIEJA = new Set(['DNI', 'TEL', 'CEL', 'NRO', 'DTO', 'DOC']);

function detectarDatosFuertes(texto, plano) {
  const ocupado = new Array(texto.length).fill(false);
  const datos = [];

  function buscar(regex, tipo, armar) {
    for (const m of plano.matchAll(regex)) {
      const inicio = m.index;
      const fin = m.index + m[0].length;
      if (ocupado.slice(inicio, fin).some(Boolean)) continue;
      const extra = armar(m, texto.slice(inicio, fin));
      if (!extra) continue;
      ocupado.fill(true, inicio, fin);
      datos.push({ tipo, inicio, fin, ...extra });
    }
  }

  // CUIL / CUIT
  buscar(new RegExp(`\\b(?:cuil|cuit)\\s*${N_ROTULO}:?\\s*(\\d{11})(?!\\d)`, 'gi'), 'cuil', (m) => ({
    valor: m[1],
  }));
  buscar(/(?<!\d)(?:20|23|24|27|30|33|34)\d{9}(?!\d)/g, 'cuil', (m) =>
    cuilValido(m[0]) ? { valor: m[0] } : null
  );

  // Teléfono: con rótulo, con +54 o por la cantidad de dígitos
  buscar(
    new RegExp(`\\b(?:telefono|tel|cel(?:ular)?|whats?app|wsp|wpp|movil|contacto)\\.?\\s*${N_ROTULO}:?\\s*(\\+?[\\d(][\\d ()-]{5,}\\d)`, 'gi'),
    'telefono',
    (m, original) => ({ valor: original.slice(original.length - m[1].length).replace(/\s+/g, ' ').trim() })
  );
  buscar(/\+\d[\d ()-]{8,}\d/g, 'telefono', (m) => ({ valor: m[0].replace(/\s+/g, ' ').trim() }));

  // Fechas, horas y montos: se marcan para que sus números no se confundan con nada
  buscar(/(?<!\d)\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?(?!\d)/g, 'ignorado', () => ({}));
  buscar(/(?<!\d)\d{1,2}:\d{2}(?!\d)/g, 'ignorado', () => ({}));
  buscar(/\$\s?[\d.,]+/g, 'ignorado', () => ({}));

  buscar(/(?<![\d+])\d+(?:[ -]\d+){0,3}(?!\d)/g, 'telefono', (m) =>
    pareceTelefono(m[0]) ? { valor: m[0] } : null
  );

  // DNI / pasaporte
  buscar(new RegExp(`\\b(?:d\\.?\\s?n\\.?\\s?i\\.?|documento|doc\\.?)\\s*${N_ROTULO}:?\\s*(\\d{6,8})(?!\\d)`, 'gi'), 'dni', (m) => ({
    valor: m[1],
  }));
  buscar(new RegExp(`\\b(?:pasaporte|pas\\.)\\s*${N_ROTULO}:?\\s*([a-z0-9]{6,10})\\b`, 'gi'), 'dni', (m) => ({
    valor: m[1].toUpperCase(),
  }));
  buscar(/(?<![\d+])\d{7,8}(?!\d)/g, 'dni', (m) => ({ valor: m[0] }));

  // Patente: con rótulo en cualquier formato, o sin rótulo si está en mayúsculas
  buscar(
    new RegExp(`\\b(?:patente|dominio|pat\\.)\\s*${N_ROTULO}:?\\s*([a-z]{2} ?-?\\d{3} ?-?[a-z]{2}|[a-z]{3} ?-?\\d{3})\\b`, 'gi'),
    'patente',
    (m) => ({ valor: formatearPatente(m[1]) })
  );
  buscar(/\b[A-Z]{2} ?-?\d{3} ?-?[A-Z]{2}\b/g, 'patente', (m) => ({ valor: formatearPatente(m[0]) }));
  buscar(/\b[A-Z]{3} ?-?\d{3}\b/g, 'patente', (m) =>
    EXCLUIDAS_PATENTE_VIEJA.has(m[0].slice(0, 3)) ? null : { valor: formatearPatente(m[0]) }
  );

  return { datos: datos.filter((d) => d.tipo !== 'ignorado'), ocupado };
}

// ── Etapa 2: trozos de texto ───────────────────────────────────────────────

/** Corta un tramo de texto por puntos, comas, punto y coma y saltos de línea. */
function partirPorSeparadores(tramo, inicioTramo) {
  const trozos = [];
  let actual = '';
  let inicioActual = inicioTramo;

  const cerrar = (i) => {
    trozos.push({ texto: actual, inicio: inicioActual, cierre: tramo[i] ?? null });
    actual = '';
    inicioActual = inicioTramo + i + 1;
  };

  for (let i = 0; i < tramo.length; i++) {
    const c = tramo[i];
    if ('\n;:,|!?¡¿'.includes(c)) {
      cerrar(i);
    } else if (c === '.') {
      // Un punto después de una inicial ("O.") o de una abreviatura ("Av.") no corta
      const palabra = (actual.match(/(\S+)$/) || [])[1] || '';
      const esInicial = /^\p{L}$/u.test(palabra);
      if (palabra && (esInicial || ABREVIATURAS.has(clave(palabra)))) {
        actual += c;
      } else {
        cerrar(i);
      }
    } else {
      actual += c;
    }
  }
  cerrar(tramo.length);
  return trozos;
}

/** Corta un trozo donde aparecen etiquetas ("Domicilio:") y anota la pista. */
function partirPorEtiquetas(trozo) {
  const plano = sinAcentos(trozo.texto);
  const partes = [];
  let desde = 0;
  let pista = null;

  for (const m of plano.matchAll(REGEX_ETIQUETAS)) {
    partes.push({ texto: trozo.texto.slice(desde, m.index), inicio: trozo.inicio + desde, pista });
    pista = Object.entries(m.groups).find(([, valor]) => valor !== undefined)[0];
    desde = m.index + m[0].length;
  }
  partes.push({ texto: trozo.texto.slice(desde), inicio: trozo.inicio + desde, pista, cierre: trozo.cierre });

  // Una etiqueta sin texto después ("Auto:" y el dato en la línea siguiente)
  // le pasa la pista al trozo que sigue.
  return partes;
}

function limpiarBordes(texto) {
  return texto.replace(/^[^\p{L}\p{N}+]+/u, '').replace(/[^\p{L}\p{N}.]+$/u, '').replace(/\s+/g, ' ').trim();
}

function quitarRellenoInicial(texto) {
  const palabras = texto.split(' ');
  while (palabras.length && RELLENO.has(clave(palabras[0]))) palabras.shift();
  return palabras.join(' ');
}

const REGEX_NOMBRE = /^[\p{L}'´`-]+\.?(?: [\p{L}'´`-]+\.?){0,6}$/u;

function esDireccion(texto, pista) {
  if (pista === 'direccion') return true;
  const m = texto.match(/^(.*?\p{L}.*?)\s+(?:(?:n|nro|numero|número)[°º.]?\s*)?(\d{1,5})(?!\d)/iu);
  if (!m) return false;
  if (REGEX_CALLE.test(sinAcentos(m[1]))) return true;
  // La calle tiene que empezar con mayúscula y no ser relleno ("Somos 3") ni
  // un día o mes ("Sábado 12")
  const palabraAnterior = m[1].split(' ').pop();
  const empiezaEnMayuscula = /^\p{Lu}/u.test(palabraAnterior);
  const palabrasDeCalle = m[1].split(' ').filter((p) => !RELLENO.has(clave(p)));
  return empiezaEnMayuscula && palabrasDeCalle.length > 0 && !DIAS_Y_MESES.has(clave(palabraAnterior)) && !RELLENO.has(clave(palabraAnterior));
}

/** "Florisbelo Acosta 3766 MdP" → "Florisbelo Acosta 3766, Mar del Plata" */
function formatearDireccion(texto) {
  const m = texto.match(/^(.*\d)\s+([^\d]+)$/);
  if (m) {
    const ciudad = buscarCiudad(m[2]);
    if (ciudad) return `${capitalizarPrimera(m[1])}, ${ciudad}`;
  }
  return capitalizarPrimera(texto);
}

function esComplementoVehiculo(texto) {
  const palabras = clave(texto).split(' ');
  return palabras.every((p) => COLORES.has(p) || /^(?:19|20)\d{2}$/.test(p));
}

/** Clasifica un trozo de texto. Puede devolver más de un ítem si hay que partirlo. */
function clasificarTrozo({ texto: crudo, inicio, pista, cierre }) {
  const texto = limpiarBordes(crudo);
  if (!texto) return [];

  if (pista === 'vehiculo') return [{ tipo: 'vehiculo', texto: capitalizarPrimera(texto), inicio }];

  // Un vehículo en el medio del trozo: lo de antes se clasifica aparte
  // ("Acosta 3766 Toyota Hilux" → domicilio + vehículo)
  const vehiculo = sinAcentos(texto).match(REGEX_VEHICULO);
  if (vehiculo) {
    const antes = texto.slice(0, vehiculo.index);
    const desde = texto.slice(vehiculo.index);
    return [
      ...(antes.trim() ? clasificarTrozo({ texto: antes, inicio, pista }) : []),
      { tipo: 'vehiculo', texto: capitalizarPrimera(desde), inicio: inicio + vehiculo.index },
    ];
  }

  if (esComplementoVehiculo(texto)) return [{ tipo: 'complementoVehiculo', texto, inicio }];
  if (REGEX_COMPLEMENTO_DIRECCION.test(clave(texto))) return [{ tipo: 'complementoDireccion', texto, inicio }];
  if (esDireccion(texto, pista)) return [{ tipo: 'direccion', texto: formatearDireccion(texto), inicio }];

  const ciudad = buscarCiudad(texto);
  if (ciudad && !['persona', 'soloNombre', 'soloApellido', 'apellidoPrimero'].includes(pista)) {
    return [{ tipo: 'ciudad', texto: ciudad, inicio }];
  }

  const nombre = quitarRellenoInicial(texto);
  if (!nombre) return []; // era sólo relleno ("Hola, te paso los datos")
  if (REGEX_NOMBRE.test(nombre)) return [{ tipo: 'nombre', texto: nombre, inicio, pista, cierre }];

  return [{ tipo: 'desconocido', texto, inicio }];
}

function extraerTrozos(texto, ocupado) {
  // Tramos de texto que no fueron tomados como dato fuerte
  const tramos = [];
  let inicio = null;
  for (let i = 0; i <= texto.length; i++) {
    const libre = i < texto.length && !ocupado[i];
    if (libre && inicio === null) inicio = i;
    if (!libre && inicio !== null) {
      tramos.push({ texto: texto.slice(inicio, i), inicio });
      inicio = null;
    }
  }

  const partes = tramos
    .flatMap((tramo) => partirPorSeparadores(tramo.texto, tramo.inicio))
    .flatMap(partirPorEtiquetas);

  // Una etiqueta sola ("Domicilio:" y el dato en la línea de abajo) le pasa
  // su pista a la parte siguiente.
  let pistaPendiente = null;
  const resultado = [];
  for (const parte of partes) {
    if (!limpiarBordes(parte.texto)) {
      if (parte.pista) pistaPendiente = parte.pista;
      continue;
    }
    resultado.push({ ...parte, pista: parte.pista || pistaPendiente });
    pistaPendiente = null;
  }
  return resultado;
}

// ── Etapa 3: unir piezas sueltas ───────────────────────────────────────────

function unirPiezas(items) {
  const resultado = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const anterior = resultado[resultado.length - 1];
    const siguiente = items[i + 1];

    // "Toyota Hilux, blanca, 2013" → un solo vehículo
    if (item.tipo === 'complementoVehiculo' && anterior?.tipo === 'vehiculo') {
      anterior.texto += ` ${item.texto}`;
      continue;
    }

    // "Acosta 3766, Mar del Plata" / "Acosta 3766, piso 2" → un solo domicilio
    if ((item.tipo === 'ciudad' || item.tipo === 'complementoDireccion') && anterior?.tipo === 'direccion') {
      anterior.texto += `, ${item.tipo === 'ciudad' ? item.texto : capitalizarPrimera(item.texto)}`;
      continue;
    }

    // Un "domicilio" que termina en un año y va pegado a una patente era un
    // vehículo que no está en la lista ("Etios 2015 AB123CD").
    if (
      item.tipo === 'direccion' &&
      siguiente?.tipo === 'patente' &&
      /\b(?:19|20)\d{2}$/.test(item.texto) &&
      !REGEX_CALLE.test(sinAcentos(item.texto))
    ) {
      resultado.push({ ...item, tipo: 'vehiculo' });
      continue;
    }

    // "Gonzalez, Maria Laura 28765432" → apellido, coma, nombre y después el DNI
    if (
      item.tipo === 'nombre' &&
      !item.pista &&
      anterior?.tipo === 'nombre' &&
      !anterior.pista &&
      anterior.cierre === ',' &&
      anterior.texto.split(' ').length <= 2 &&
      (siguiente?.tipo === 'dni' || siguiente?.tipo === 'cuil')
    ) {
      resultado[resultado.length - 1] = {
        ...anterior,
        texto: `${item.texto} ${anterior.texto}`,
        partes: { nombre: item.texto, apellido: anterior.texto },
      };
      continue;
    }

    // "Nombre: Juan" + "Apellido: Pérez" → un solo nombre
    const esParteDeNombre = (it) => it?.tipo === 'nombre' && (it.pista === 'soloNombre' || it.pista === 'soloApellido');
    if (esParteDeNombre(item) && esParteDeNombre(anterior) && item.pista !== anterior.pista) {
      const nombre = item.pista === 'soloNombre' ? item.texto : anterior.texto;
      const apellido = item.pista === 'soloApellido' ? item.texto : anterior.texto;
      resultado[resultado.length - 1] = { ...anterior, texto: `${nombre} ${apellido}`, partes: { nombre, apellido }, pista: 'persona' };
      continue;
    }

    resultado.push(item);
  }
  return resultado;
}

// ── Etapa 4: armar las personas ────────────────────────────────────────────

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'di', 'da', 'van', 'von', 'dos', 'das']);

function formatearPalabra(palabra, esPrimera) {
  if (/^\p{L}\.?$/u.test(palabra)) return `${palabra[0].toLocaleUpperCase('es')}.`; // inicial
  const minuscula = palabra.toLocaleLowerCase('es');
  if (!esPrimera && PARTICULAS.has(clave(minuscula))) return minuscula;
  return minuscula.replace(/(^|[-'´])(\p{L})/gu, (_, separador, letra) => separador + letra.toLocaleUpperCase('es'));
}

/**
 * Las partículas van en minúscula ("Juan de la Fuente") salvo que abran el
 * nombre completo: el apellido se formatea con `abreElNombre` en false.
 */
function formatearNombre(palabras, abreElNombre = true) {
  return palabras.map((p, i) => formatearPalabra(p, abreElNombre && i === 0)).join(' ');
}

/** Separa "Norma Graciela Berger" en nombre "Norma Graciela" y apellido "Berger". */
function separarNombre(item) {
  const resultado = separarPalabrasDelNombre(item);
  return {
    nombre: formatearNombre(resultado.nombre),
    apellido: formatearNombre(resultado.apellido, resultado.nombre.length === 0),
  };
}

function separarPalabrasDelNombre(item) {
  const partir = (texto) => texto.split(' ').filter(Boolean);
  if (item.partes) return { nombre: partir(item.partes.nombre), apellido: partir(item.partes.apellido) };

  const palabras = partir(item.texto);
  if (item.pista === 'soloApellido') return { nombre: [], apellido: palabras };
  if (item.pista === 'soloNombre' || palabras.length === 1) return { nombre: palabras, apellido: [] };

  if (item.pista === 'apellidoPrimero') {
    let corte = 0;
    while (corte < palabras.length - 1 && PARTICULAS.has(clave(palabras[corte]))) corte++;
    return { apellido: palabras.slice(0, corte + 1), nombre: palabras.slice(corte + 1) };
  }

  // Si el apellido viene en mayúsculas ("Norma Graciela BERGER") se respeta eso
  const enMayusculas = palabras.map(
    (p) => p.replace(/\./g, '').length > 1 && p === p.toLocaleUpperCase('es') && p !== p.toLocaleLowerCase('es')
  );
  if (enMayusculas.some(Boolean) && !enMayusculas.every(Boolean)) {
    return {
      nombre: palabras.filter((_, i) => !enMayusculas[i]),
      apellido: palabras.filter((_, i) => enMayusculas[i]),
    };
  }

  // Si no, el apellido es la última palabra, con sus partículas ("de la Fuente")
  let corte = palabras.length - 1;
  while (corte > 1 && PARTICULAS.has(clave(palabras[corte - 1]))) corte--;
  return { nombre: palabras.slice(0, corte), apellido: palabras.slice(corte) };
}

const ETIQUETA_CAMPO = {
  cuil: 'CUIL',
  telefono: 'teléfono',
  direccion: 'domicilio',
  vehiculoModelo: 'vehículo',
  vehiculoPatente: 'patente',
};

function armarPersonas(items) {
  const personas = [];
  const avisosGenerales = [];
  const usados = new Set();

  const nombreLibre = (item) => item?.tipo === 'nombre' && !usados.has(item) ? item : null;
  const nuevaPersona = (itemNombre, dni, inicio) => {
    if (itemNombre) usados.add(itemNombre);
    const persona = { itemNombre, dni: dni || '', inicio, avisos: [] };
    personas.push(persona);
    return persona;
  };

  // Un nombre pegado a un DNI (antes o después) es una persona
  items.forEach((item, i) => {
    if (item.tipo === 'dni') {
      const existente = personas.find((p) => p.dni === item.valor);
      if (existente) {
        usados.add(item);
        return;
      }
      const anterior = nombreLibre(items[i - 1]);
      const siguiente = items[i + 2]?.tipo === 'dni' ? null : nombreLibre(items[i + 1]);
      const itemNombre = anterior || siguiente;
      nuevaPersona(itemNombre, item.valor, itemNombre ? Math.min(itemNombre.inicio, item.inicio) : item.inicio);
      usados.add(item);
    }

    // Un nombre pegado a un CUIL sin DNI: el DNI sale del CUIL
    if (item.tipo === 'cuil') {
      const dni = dniDelCuil(item.valor);
      if (personas.some((p) => p.dni === dni)) return;
      const anterior = nombreLibre(items[i - 1]);
      if (anterior && items[i + 1]?.tipo !== 'dni') {
        nuevaPersona(anterior, dni, anterior.inicio).dniDesdeCuil = true;
      }
    }
  });

  // Nombres sin DNI: cuentan si vienen con etiqueta ("Titular: ...") o si son
  // lo primero del mensaje y están escritos como nombre propio ("Norma
  // Berger", no "tienen lugar para el finde"). Si no, se avisa y no se usan.
  const primerItem = items.find((it) => it.tipo !== 'desconocido');
  const pareceNombrePropio = (texto) =>
    texto.includes(' ') && texto.split(' ').every((p) => PARTICULAS.has(clave(p)) || /^\p{Lu}/u.test(p));
  for (const item of items) {
    if (!nombreLibre(item)) continue;
    const conEtiqueta = ['persona', 'soloNombre', 'soloApellido', 'apellidoPrimero'].includes(item.pista);
    const esPrimero = item === primerItem && pareceNombrePropio(item.texto);
    if (conEtiqueta || esPrimero) {
      nuevaPersona(item, '', item.inicio);
    } else {
      avisosGenerales.push(`No se usó: "${item.texto}"`);
    }
  }

  personas.sort((a, b) => a.inicio - b.inicio);

  // El resto de los datos van al titular; si el titular ya tiene ese dato,
  // a la persona mencionada justo antes.
  const datosSueltos = items.filter((it) => ['cuil', 'telefono', 'direccion', 'ciudad', 'vehiculo', 'patente'].includes(it.tipo));
  if (personas.length === 0 && datosSueltos.length > 0) {
    nuevaPersona(null, '', 0);
  }

  const destinoPara = (item, campo) => {
    const titular = personas[0];
    if (!titular[campo]) return titular;
    return [...personas].reverse().find((p) => p.inicio < item.inicio) || titular;
  };

  const asignar = (persona, campo, valor) => {
    if (persona[campo]) {
      persona.avisos.push(`Había otro ${ETIQUETA_CAMPO[campo]} en el mensaje: "${valor}"`);
    } else {
      persona[campo] = valor;
    }
  };

  for (const item of datosSueltos) {
    switch (item.tipo) {
      case 'cuil': {
        const dni = dniDelCuil(item.valor);
        const persona = personas.find((p) => p.dni === dni) || destinoPara(item, 'cuil');
        asignar(persona, 'cuil', formatearCuil(item.valor));
        break;
      }
      case 'telefono':
        asignar(destinoPara(item, 'telefono'), 'telefono', item.valor);
        break;
      case 'direccion':
      case 'ciudad':
        asignar(destinoPara(item, 'direccion'), 'direccion', item.texto);
        break;
      case 'vehiculo':
        asignar(destinoPara(item, 'vehiculoModelo'), 'vehiculoModelo', item.texto);
        break;
      case 'patente':
        asignar(destinoPara(item, 'vehiculoPatente'), 'vehiculoPatente', item.valor);
        break;
    }
  }

  for (const item of items) {
    if (item.tipo === 'desconocido' || item.tipo === 'complementoVehiculo' || item.tipo === 'complementoDireccion') {
      avisosGenerales.push(`No se usó: "${item.texto}"`);
    }
  }

  return { personas, avisosGenerales };
}

// ── Resultado final ────────────────────────────────────────────────────────

function armarHuesped(persona, indice) {
  const { nombre, apellido } = persona.itemNombre ? separarNombre(persona.itemNombre) : { nombre: '', apellido: '' };
  const avisos = [...persona.avisos];
  const rol = indice === 0 ? 'titular' : 'acompañante';

  if (!nombre) avisos.unshift('Falta el nombre');
  if (!apellido) avisos.unshift('Falta el apellido');
  if (!persona.dni) avisos.unshift('Falta el DNI');
  if (persona.dniDesdeCuil) avisos.push('El DNI se sacó del CUIL');

  if (persona.itemNombre && !persona.itemNombre.partes) {
    const palabras = persona.itemNombre.texto.split(' ').filter((p) => !PARTICULAS.has(clave(p)) && !/^\p{L}\.?$/u.test(p));
    if (palabras.length >= 4) avisos.push('Revisá cómo quedaron separados el nombre y el apellido');
  }

  if (persona.cuil) {
    if (!cuilValido(persona.cuil)) {
      avisos.push('El CUIL no es válido: revisá los números');
    } else if (persona.dni && /^\d+$/.test(persona.dni) && dniDelCuil(persona.cuil) !== persona.dni.replace(/^0+/, '')) {
      avisos.push('El CUIL no coincide con el DNI');
    }
  }

  if (rol === 'titular' && !persona.telefono) avisos.push('No vino el teléfono (hace falta para el WhatsApp)');

  return {
    rol,
    nombre,
    apellido,
    dni: persona.dni || '',
    cuil: persona.cuil || '',
    telefono: persona.telefono || '',
    direccion: persona.direccion || '',
    vehiculoModelo: persona.vehiculoModelo || '',
    vehiculoPatente: persona.vehiculoPatente || '',
    avisos,
  };
}

/**
 * Interpreta un mensaje y devuelve:
 *   { huespedes: [{ rol, nombre, apellido, dni, cuil, telefono, direccion,
 *                   vehiculoModelo, vehiculoPatente, avisos }],
 *     avisos: [...] }   ← lo que no se pudo ubicar en ningún huésped
 */
function interpretarMensaje(mensaje) {
  const texto = normalizar(mensaje);
  const plano = sinAcentos(texto);

  const { datos, ocupado } = detectarDatosFuertes(texto, plano);
  const trozos = extraerTrozos(texto, ocupado).flatMap(clasificarTrozo);
  const items = unirPiezas([...datos, ...trozos].sort((a, b) => a.inicio - b.inicio));

  const { personas, avisosGenerales } = armarPersonas(items);
  const huespedes = personas.map(armarHuesped);

  const avisos = [...avisosGenerales];
  if (huespedes.length === 0) avisos.unshift('No se encontró ningún huésped en el mensaje');

  const dnis = huespedes.map((h) => h.dni).filter(Boolean);
  if (new Set(dnis).size !== dnis.length) avisos.push('Hay un DNI repetido entre los huéspedes');

  return { huespedes, avisos };
}

export { interpretarMensaje, cuilValido };
