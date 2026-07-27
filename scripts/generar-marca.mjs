/**
 * Genera el juego de logotipos de public/marca/ desde el archivo original.
 *
 *   node scripts/generar-marca.mjs <ruta-a-Logo_PNA.png>
 *
 * Por qué existe (docs/MANUAL-IMAGEN.md §7): los PNG «transparentes» que
 * circulaban se recortaron con umbral duro y sin suavizado — 19 y 48 píxeles
 * semitransparentes en todo el borde, y colores fuera de la marca alrededor
 * de los rayos. El único archivo limpio es la lámina de dos paneles, así que
 * los recortes se derivan de ahí y se pueden volver a generar.
 *
 * Método. El fondo de cada panel es uniforme y las tintas son dos colores
 * planos conocidos. Para cada píxel se proyecta (píxel − fondo) sobre cada
 * (tinta − fondo); la tinta con menor residuo gana, y la longitud de esa
 * proyección ES el alfa. Después se desmultiplica el color. Eso reconstruye
 * el antialiasing original en vez de destruirlo, que es justo el defecto de
 * los archivos viejos.
 *
 * Limitación conocida: en la versión de fondo claro, «GUANAJUATO» está calado
 * en blanco sobre la banda turquesa, y el blanco coincide con el fondo del
 * panel, así que esas letras quedan transparentes. Es correcto sobre blanco o
 * casi blanco —el uso que el manual autoriza para esta versión (§2)— pero no
 * sobre un color medio. Para fondos oscuros existe `logo-oscuro.png`, donde
 * el blanco sí se conserva.
 *
 * NO sustituye al SVG. El recorte útil mide ~650 px: alcanza para pantalla e
 * impresos chicos, no para lona ni cartel. Vectorizar sigue pendiente (§7).
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const DESTINO = "public/marca";

/** Recortes medidos sobre el original de 1024×1536, con margen de holgura. */
const PANELES = {
  claro: {
    recorte: { left: 178, top: 95, width: 644, height: 490 },
    fondo: [251, 251, 252],
    tintas: [
      [251, 192, 0], // amarillo #FBC000
      [0, 163, 173], // turquesa #00A3AD
    ],
  },
  oscuro: {
    // El logotipo del panel oscuro NO está alineado con el del claro: ocupa
    // otra posición y otro tamaño, por eso se mide y se recorta aparte.
    recorte: { left: 172, top: 768 + 71, width: 661, height: 485 },
    fondo: [1, 1, 1],
    tintas: [
      [251, 208, 10], // amarillo aclarado #FBD00A
      [42, 176, 187], // turquesa aclarado #2AB0BB
      [255, 255, 255], // «GUANAJUATO», calado en blanco sobre la banda
    ],
  },
};

/** Separa el fondo y devuelve RGBA con alfa suave. */
function extraerAlfa(datos, ancho, alto, fondo, tintas) {
  const salida = Buffer.alloc(ancho * alto * 4);

  // |tinta − fondo|² para cada tinta, precalculado.
  const vectores = tintas.map((t) => {
    const v = [t[0] - fondo[0], t[1] - fondo[1], t[2] - fondo[2]];
    return { v, normaCuadrada: v[0] * v[0] + v[1] * v[1] + v[2] * v[2] };
  });

  for (let i = 0, p = 0; i < ancho * alto; i++, p += 3) {
    const d = [datos[p] - fondo[0], datos[p + 1] - fondo[1], datos[p + 2] - fondo[2]];

    let mejorAlfa = 0;
    let mejorResiduo = Infinity;
    let mejorTinta = tintas[0];

    for (let k = 0; k < vectores.length; k++) {
      const { v, normaCuadrada } = vectores[k];
      const proyeccion = (d[0] * v[0] + d[1] * v[1] + d[2] * v[2]) / normaCuadrada;
      const a = Math.min(1, Math.max(0, proyeccion));

      const rx = d[0] - a * v[0];
      const ry = d[1] - a * v[1];
      const rz = d[2] - a * v[2];
      const residuo = rx * rx + ry * ry + rz * rz;

      if (residuo < mejorResiduo) {
        mejorResiduo = residuo;
        mejorAlfa = a;
        mejorTinta = tintas[k];
      }
    }

    const q = i * 4;
    if (mejorAlfa <= 0.004) {
      salida[q] = salida[q + 1] = salida[q + 2] = salida[q + 3] = 0;
      continue;
    }

    // Desmultiplicar: el píxel observado es alfa·tinta + (1−alfa)·fondo.
    // Se recupera el color puro para que el borde no arrastre el fondo.
    for (let c = 0; c < 3; c++) {
      const observado = datos[p + c];
      const puro = (observado - (1 - mejorAlfa) * fondo[c]) / mejorAlfa;
      salida[q + c] = Math.min(255, Math.max(0, Math.round(puro)));
    }
    // Anclar el color a la tinta cuando el píxel es prácticamente opaco:
    // evita que el redondeo introduzca tonos que no son de la marca.
    if (mejorAlfa > 0.97) {
      salida[q] = mejorTinta[0];
      salida[q + 1] = mejorTinta[1];
      salida[q + 2] = mejorTinta[2];
    }
    salida[q + 3] = Math.round(mejorAlfa * 255);
  }

  return salida;
}

/** Recorta al contenido real, dejando un margen proporcional. */
async function recortarAlContenido(imagen) {
  return imagen.trim({ threshold: 1 });
}

async function guardar(rgba, ancho, alto, nombre) {
  const imagen = sharp(rgba, { raw: { width: ancho, height: alto, channels: 4 } }).png({
    compressionLevel: 9,
  });
  const ruta = path.join(DESTINO, nombre);
  await (await recortarAlContenido(imagen)).toFile(ruta);
  const meta = await sharp(ruta).metadata();
  console.log(`  ${nombre.padEnd(22)} ${meta.width}×${meta.height}`);
  return ruta;
}

/** Aplana el color a uno solo, conservando el alfa. Para las versiones a una tinta. */
function monocromo(rgba, color) {
  const salida = Buffer.from(rgba);
  for (let q = 0; q < salida.length; q += 4) {
    if (salida[q + 3] === 0) continue;
    salida[q] = color[0];
    salida[q + 1] = color[1];
    salida[q + 2] = color[2];
  }
  return salida;
}

async function main() {
  const origen = process.argv[2];
  if (!origen || !existsSync(origen)) {
    console.error("Uso: node scripts/generar-marca.mjs <ruta-a-Logo_PNA.png>");
    process.exit(1);
  }

  await mkdir(DESTINO, { recursive: true });

  const generados = {};

  for (const [nombre, cfg] of Object.entries(PANELES)) {
    const { data, info } = await sharp(origen)
      .extract(cfg.recorte)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rgba = extraerAlfa(data, info.width, info.height, cfg.fondo, cfg.tintas);
    generados[nombre] = { rgba, ancho: info.width, alto: info.height };
  }

  console.log("Generando en", DESTINO);
  await guardar(generados.claro.rgba, generados.claro.ancho, generados.claro.alto, "logo-color.png");
  await guardar(generados.oscuro.rgba, generados.oscuro.ancho, generados.oscuro.alto, "logo-oscuro.png");

  // Monocromos: se derivan del panel claro, que tiene el trazo más limpio.
  const { rgba, ancho, alto } = generados.claro;
  await guardar(monocromo(rgba, [26, 26, 26]), ancho, alto, "logo-negro.png");
  await guardar(monocromo(rgba, [255, 255, 255]), ancho, alto, "logo-blanco.png");

  // ── Versión reducida ──
  // El manual (§7, acción 3) pide una versión reducida porque «GUANAJUATO»
  // se cierra por debajo de 180 px. Aquí se usa SOLO EL SOL: a 32 px es lo
  // único que se distingue, y es la parte separable sin reconstruir el
  // lockup. Es un recorte provisional, no una versión autorizada de marca —
  // el reducido oficial (sol + «Nuevo Amanecer») lo tiene que dibujar quien
  // haga el vectorial.
  const soloSol = await sharp(rgba, { raw: { width: ancho, height: alto, channels: 4 } })
    // 0.70 y no 0.73: el arco de la banda sube por los extremos, y a 0.73 se
    // colaba una rebanada cortada del turquesa que parecía un error.
    .extract({ left: 0, top: 0, width: ancho, height: Math.round(alto * 0.70) })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(DESTINO, "logo-sol.png"), soloSol);
  const metaSol = await sharp(soloSol).metadata();
  console.log(`  ${"logo-sol.png".padEnd(22)} ${metaSol.width}×${metaSol.height}`);

  // Icono de pestaña: cuadrado, con el sol centrado y aire alrededor.
  const lado = 512;
  const margen = Math.round(lado * 0.08);
  const solEscalado = await sharp(soloSol)
    .resize(lado - margen * 2, lado - margen * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: solEscalado, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile("app/icon.png");
  console.log(`  ${"app/icon.png".padEnd(22)} ${lado}×${lado}`);

  console.log("\nListo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
