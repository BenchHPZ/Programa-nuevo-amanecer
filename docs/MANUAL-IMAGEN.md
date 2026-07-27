# Manual de imagen — Programa Nuevo Amanecer

Guía breve de identidad visual: cómo se usan el logotipo, los colores, la tipografía y el
lenguaje del programa, en el sistema y fuera de él.

> **Alcance.** Este manual cubre la identidad de **comunicación** (landing, papelería, folios,
> constancias, credenciales, redes). No sustituye a [CUMPLIMIENTO.md](CUMPLIMIENTO.md), que
> manda en todo lo relativo a datos personales, imagen de pacientes y consentimientos.

---

## 1. La marca en una frase

> Desde 1984, un equipo que dona su tiempo para **provocar la sonrisa** de niñas y niños con
> labio y/o paladar hendido, sin costo para sus familias.

Los hechos que sostienen esa frase — y que se pueden citar en cualquier material — están en
[HISTORIA.md](HISTORIA.md): fundado en 1984 en la Clínica Hospital del ISSSTE Guanajuato por el
Dr. Miguel Covarrubias Mata; dos jornadas al año; ~200 niñas y niños atendidos por año; más de
**4,700 procedimientos quirúrgicos** acumulados; alrededor de **30 especialistas voluntarios**
por campaña.

### Atributos

| Atributo | Qué significa en la práctica |
|---|---|
| **Esperanza** | El sol naciente, no la cicatriz. Se comunica el después, no el antes. |
| **Calidez** | Se habla a las familias, no sobre ellas. Lenguaje llano, sin tecnicismos. |
| **Rigor** | Es un acto médico. Nada de la comunicación debe verse improvisado. |
| **Gratuidad digna** | Es gratuito, no caritativo. Nunca se representa al paciente como carencia. |
| **Arraigo** | Guanajuato está en el logotipo. La marca es local antes que genérica. |

---

## 2. Logotipo

### Anatomía

El lockup tiene tres partes y **siempre van juntas** (no existe todavía una versión autorizada
del sol por separado — ver §7):

| Parte | Descripción | Proporción real |
|---|---|---|
| **Isotipo** | Sol naciente de 21 rayos con 4 arcos concéntricos | 615 × 376 px |
| **Banda** | Arco turquesa con «GUANAJUATO» calado en blanco | 648 × 131 px |
| **Logotipo** | «Nuevo Amanecer», letra dibujada a mano | 533 px de ancho |
| **Conjunto** | | **654 × 486 px — relación 1.35 : 1** |

El sol naciendo sobre el horizonte es la metáfora central: el arco turquesa es a la vez horizonte
y sonrisa. Por eso **el arco nunca se voltea** — invertirlo lo convierte en el gesto contrario.

### Versiones

| Versión | Cuándo se usa |
|---|---|
| **Color / fondo claro** | Uso preferente. Blanco o fondos muy claros y neutros. |
| **Color / fondo oscuro** | Sobre negro o tonos oscuros. Aclara ambos colores (§3). |
| **Monocromo negro** | Fotocopia, fax, sellos, papelería a una tinta, documentos oficiales. |
| **Monocromo blanco** | Calado sobre fotografía o color sólido. |

Sobre fotografía, el logotipo va **siempre en monocromo blanco** y sobre una zona lisa y oscura
de la imagen. Nunca la versión a color encima de una foto.

### Área de resguardo

**x = altura de la «N» de NUEVO** (59 px cuando el lockup mide 654 px de ancho ≈ **9 % del ancho**).

Debe quedar libre un margen de `x` por los cuatro lados. Nada entra ahí: ni texto, ni otro
logotipo, ni el borde de la hoja. Cuando aparece junto a logos de aliados (ISSSTE, SSG, DIF,
patrocinadores), la separación mínima entre marcas es **2x**.

### Tamaño mínimo

Lo que limita no es el sol, es la palabra «GUANAJUATO»: mide apenas 25 % del ancho del lockup.

| Medio | Ancho mínimo del conjunto |
|---|---|
| Pantalla | **180 px** |
| Impresión | **45 mm** |

Por debajo de eso «GUANAJUATO» se cierra y el logotipo se ve sucio. Para favicon, sellos
pequeños o bordados hace falta una versión reducida que aún no existe (§7).

### Usos incorrectos

1. **No** cambiar los colores ni aplicar degradados.
2. **No** deformar, inclinar ni rotar. Escalado proporcional siempre.
3. **No** voltear el arco ni reacomodar las partes.
4. **No** agregar sombra, contorno, brillo ni relieve.
5. **No** encerrarlo en una caja o círculo.
6. **No** re-escribir «Nuevo Amanecer» con una fuente: el logotipo es dibujo, no texto.
7. **No** colocarlo sobre fondos de color medio donde el amarillo pierde contraste.
8. **No** usar el archivo con fondo transparente actual — está dañado (§7).

---

## 3. Color

Valores muestreados directamente del archivo original, no estimados.

### Primarios — fondo claro

| Color | HEX | RGB | CMYK aprox. | Pantone aprox. |
|---|---|---|---|---|
| **Amarillo amanecer** | `#FBC000` | 251 · 192 · 0 | 0 · 24 · 100 · 0 | 7408 C |
| **Turquesa horizonte** | `#00A3AD` | 0 · 163 · 173 | 100 · 6 · 0 · 32 | 320 C |

### Primarios — fondo oscuro

El logotipo original **ya aclara ambos colores** sobre negro. No es un capricho: los valores de
fondo claro se apagan sobre oscuro. Esta variante es obligatoria en modo oscuro.

| Color | HEX | RGB |
|---|---|---|
| **Amarillo amanecer / oscuro** | `#FBD00A` | 251 · 208 · 10 |
| **Turquesa horizonte / oscuro** | `#2AB0BB` | 42 · 176 · 187 |

> Los equivalentes CMYK y Pantone son de referencia. **Confirmar con el impresor** con una prueba
> física antes de cualquier tiraje.

### Neutros

| Uso | HEX |
|---|---|
| Texto principal | `#1A1A1A` |
| Texto secundario | `#5A6A6C` |
| Bordes y separadores | `#DCE5E6` |
| Fondo de sección | `#F4FAFA` |
| Blanco | `#FFFFFF` |

### Escala turquesa para interfaz

El turquesa de marca es un color de identidad, no una paleta de UI. Esta escala mantiene el mismo
tono (H ≈ 202) y resuelve estados, texto y fondos.

| Token | HEX | Contraste s/blanco | Uso |
|---|---|---|---|
| `turquesa-50` | `#EDFCFC` | — | Fondo de aviso |
| `turquesa-100` | `#D3F3F5` | — | Fondo de chip / badge |
| `turquesa-300` | `#79D6DB` | — | Bordes decorativos |
| `turquesa-500` | `#00A3AD` | 3.07 : 1 | **Color de marca.** Fondos, iconos, texto grande |
| `turquesa-600` | `#008A93` | 4.15 : 1 | Hover y bordes. **No para el botón primario** — ver abajo |
| `turquesa-700` | `#007178` | **5.78 : 1** | **Botón primario, texto y enlaces sobre blanco** |
| `turquesa-800` | `#00595E` | 8.11 : 1 | Texto sobre fondos turquesa claros |

### Reglas de accesibilidad — no negociables

Este sistema lo usan capturistas durante jornadas largas y familias en su teléfono. El contraste
no es estética.

1. **El amarillo nunca lleva texto encima ni es texto.** `#FBC000` sobre blanco da **1.66 : 1**.
   Es un color de superficie: se usa relleno, con texto `#1A1A1A` encima (10.48 : 1).
2. **`#00A3AD` no se usa para texto normal.** Da 3.07 : 1 sobre blanco — reprueba WCAG AA (4.5 : 1).
   Sirve para texto ≥ 24 px, iconos, bordes y fondos. **Para texto corrido y enlaces se usa
   `turquesa-700` (`#007178`, 5.78 : 1).**

   > **Corregido el 3 de agosto de 2026.** Este manual asignaba `turquesa-600` (4.15 : 1) al
   > botón primario. Medido en el navegador, la etiqueta blanca de un botón queda en 4.15 : 1 y
   > **reprueba AA igual que el 500**: el texto de un botón es texto normal de 14 px, no texto
   > grande, así que le aplica el umbral de 4.5 : 1, no el de 3 : 1. El botón primario usa
   > `turquesa-700`, que da 5.78 : 1. La diferencia visual es mínima y la regla queda coherente.
3. **El color nunca es el único portador de información.** Todo estado (candidato / no candidato /
   pendiente) lleva además texto o icono. Hay daltonismo entre el personal y entre las familias.
4. **Los documentos impresos se diseñan en monocromo.** Se imprimen en láser blanco y negro y se
   fotocopian. Si un folio o un consentimiento solo se entiende a color, está mal diseñado.

### Tokens listos para `app/globals.css`

Formato `oklch` para empatar con el resto del archivo.

```css
:root {
  /* Marca */
  --marca-amarillo:        oklch(0.838 0.172 86.1);   /* #FBC000 */
  --marca-turquesa:        oklch(0.652 0.111 202.5);  /* #00A3AD */

  /* Escala turquesa */
  --turquesa-50:  oklch(0.980 0.016 196.9);  /* #EDFCFC */
  --turquesa-100: oklch(0.942 0.033 201.2);  /* #D3F3F5 */
  --turquesa-600: oklch(0.577 0.098 202.9);  /* #008A93 */
  --turquesa-700: oklch(0.500 0.085 202.3);  /* #007178 — texto */
  --turquesa-800: oklch(0.422 0.072 201.4);  /* #00595E */
}

.dark {
  --marca-amarillo: oklch(0.869 0.177 93.6);  /* #FBD00A */
  --marca-turquesa: oklch(0.694 0.109 203.4); /* #2AB0BB */
}
```

> Hoy `globals.css` trae el tema neutro por defecto de shadcn (todo en escala de grises). Aplicar
> estos tokens es un cambio pendiente, no algo ya hecho.

---

## 4. Tipografía

### Lectura del logotipo

Confirmado: el logotipo combina dos voces tipográficas distintas.

- **«GUANAJUATO»** — sans serif geométrica, bold, caja alta, con interletrado abierto.
- **«Nuevo Amanecer»** — **no es script ni cursiva**: son mayúsculas dibujadas a mano, de trazo
  grueso y redondeado, con alturas deliberadamente irregulares. Es lettering, probablemente
  personalizado; ninguna fuente comercial lo reproduce exacto.

### Familias

| Rol | Familia | Por qué |
|---|---|---|
| **Títulos e institucional** | **Montserrat** (600 / 700) | Es la coincidencia más cercana a «GUANAJUATO»: geométrica, mismo tono. Gratuita, funciona en Word y Google Docs, la usa cualquier imprenta. |
| **Interfaz y texto corrido** | **Geist** (400 / 500 / 600) | **Ya está instalada** en el proyecto. Neutra, cifras claras y distingue bien `0/O` y `1/l/I` — importante en folios, CURP y teléfonos. |
| **Sustituto de Geist** | Inter, o Arial | Para plantillas de Word e imprentas sin Geist. |
| **Decorativa** | Caveat Brush | **Uso restringido — ver abajo.** |

Dos familias bastan. Montserrat para lo que anuncia, Geist para lo que se lee y se llena.

### Sobre la letra manuscrita

De las opciones propuestas, *Pacifico*, *Lobster Two* y *Baloo 2* no corresponden: son scripts
conectados o redondeadas, y el logotipo son mayúsculas de marcador separadas. *Amatic SC* está
más cerca en espíritu pero es delgada y condensada, lo contrario del trazo grueso del original.
**Caveat Brush** es la aproximación más razonable en Google Fonts.

Dicho eso, la recomendación es **no usarla casi nunca**:

- La voz manuscrita **ya la aporta el logotipo**. Repetirla en los textos la abarata.
- **Prohibida** en formularios, folios, consentimientos, constancias, avisos de privacidad y
  cualquier pantalla de captura. Son documentos médico-administrativos: la letra dibujada resta
  seriedad y legibilidad, y varios se leen bajo presión de tiempo.
- Uso admisible: una palabra suelta en un cartel, playera o lona de campaña. Nunca en párrafo,
  nunca por debajo de 24 px, nunca en algo que se firme.

### Escala

| Nivel | Fuente / peso | Tamaño | Interlínea |
|---|---|---|---|
| H1 | Montserrat 700 | 36–40 px | 1.15 |
| H2 | Montserrat 600 | 24–28 px | 1.2 |
| H3 | Geist 600 | 18–20 px | 1.3 |
| Cuerpo | Geist 400 | **16 px mínimo** | 1.6 |
| Etiqueta de campo | Geist 500 | 14 px | 1.4 |
| Nota al pie | Geist 400 | 13 px | 1.5 |
| **Folio** | Geist 600, tabular | 24 px+ | 1.0 |

Reglas: nada por debajo de **13 px** en pantalla ni **9 pt** impreso — hay abuelas y padres
leyendo estos formatos. El texto corrido nunca va todo en mayúsculas. Los folios y cifras usan
**cifras tabulares** para que alineen en columna.

---

## 5. Tono y lenguaje

Se escribe en **español de México**, de usted, en frases cortas. El destinatario habitual es una
madre o un padre con escolaridad variable que llega a una jornada, no un médico.

| En vez de | Se escribe |
|---|---|
| «Paciente portador de fisura labiopalatina» | «Niña o niño con labio y/o paladar hendido» |
| «Deformidad», «defecto», «malformación» | «Labio y/o paladar hendido» |
| «Beneficiario» | «Paciente», o su nombre |
| «Sujeto no candidato» | «Por ahora no es posible operar. Le explicamos por qué» |
| «Debe presentar la documentación requerida» | «Traiga estos papeles:» + lista |

Además:

- **Lenguaje de persona primero.** «Niños con labio hendido», nunca «los hendidos».
- **Nunca se promete un resultado quirúrgico.** Se explica el proceso y quién decide.
- **Se nombra que es gratuito, sin pedir gratitud.** Es un derecho ejercido, no un favor.
- **Sin lástima.** Ni en el texto ni en las imágenes.

### Imagen de pacientes

Regla dura, alineada con [CUMPLIMIENTO.md](CUMPLIMIENTO.md) y con el `README`:

1. **Ninguna fotografía de paciente se publica sin consentimiento escrito** de quien ejerce la
   patria potestad, específico para difusión y revocable.
2. **Nunca fotos «antes / después»** en comunicación pública.
3. **Ninguna captura de pantalla con datos reales** en documentación, issues o presentaciones.
4. Para material público se prefiere ilustración, el equipo médico en acción, o fotografía donde
   el paciente no sea identificable.

---

## 6. Aplicaciones

| Pieza | Criterio |
|---|---|
| **Landing pública** | Logo a color arriba a la izquierda, ≥ 180 px. Botón primario `turquesa-600`. El amarillo solo como acento. |
| **Folio impreso** | **Monocromo negro.** El folio y su QR mandan; el logo va reducido en el encabezado. Se imprime en térmica y en carta. |
| **Consentimientos y constancias** | Monocromo negro, encabezado con logo + nombre legal completo: *Programa Nuevo Amanecer, A.C.* |
| **Pantallas de captura** | Sin logo en el cuerpo. Sirven para trabajar; la marca estorba. |
| **Gafetes de voluntarios** | Color sobre blanco. Rol en Montserrat 700 y en alto contraste, legible a 2 m. |
| **Lonas y señalización** | Logo grande, una sola instrucción por lona, tipografía ≥ 60 pt. |
| **Redes sociales** | Versión sobre fondo oscuro o calada. Perfil: hace falta la versión reducida (§7). |

Con logos de aliados, el de Nuevo Amanecer va **primero o al centro** cuando la asociación
organiza; se subordina cuando la sede es institucional y así lo pide el convenio.

---

## 7. Estado de los archivos — pendientes

Auditoría de los tres archivos existentes. **Hay problemas reales que conviene resolver antes de
imprimir nada.**

| Archivo | Medida | Diagnóstico |
|---|---|---|
| `Logo_PNA.png` | 1024 × 1536 | **Único archivo limpio**, pero es una lámina de presentación con dos paneles. El logo útil dentro mide solo **654 × 486**. |
| `Logo_PNA_transparente.png` | 700 × 500 | ⚠ **Dañado. No usar.** |
| `Logo_PNA_bn_transparente.png` | 700 × 500 | ⚠ Mismo defecto, más leve. |
| `Logo_PNA.xcf` / `.xcf` | — | Fuentes de GIMP. **Permiten re-exportar bien.** |

**Por qué el archivo transparente está dañado:** tiene 7,693 colores distintos en un logotipo que
debería tener tres, y apenas **19 píxeles semitransparentes** en todo el borde. Un recorte con
antialiasing correcto tendría miles. Se recortó con un umbral duro tipo «seleccionar por color»,
sin suavizado: los bordes quedaron dentados y aparecieron colores que no son de la marca
(`#B98D00`, `#FE8B00` donde debería haber `#FBC000`). Se ve como suciedad alrededor de los rayos.

### Acciones pendientes

1. ⏳ **Vectorizar el logotipo (SVG).** Es lo más importante y **sigue pendiente**. No existe
   versión vectorial y el raster útil es de ~650 px: a 300 dpi eso son **5.5 × 4.1 cm**. Alcanza
   para pantalla y para los impresos del expediente; **no** para lona, cartel ni gafete grande.
   Un autotrazado del lettering dibujado a mano daría un resultado sucio: esto es trabajo de
   diseño, no de software.
2. ✅ **Re-exportar los PNG.** Hecho el 3 de agosto de 2026, pero **desde `Logo_PNA.png`**, no
   desde los `.xcf`: la lámina de dos paneles es el único archivo limpio. Ver §7.1.
3. ⚠ **Versión reducida.** Se generó `logo-sol.png` —solo el sol— para favicon y avatar, que es
   lo único legible a 32 px. **No es la reducida que pide este manual** (sol + «Nuevo Amanecer»
   sin la banda): esa hay que dibujarla junto con el vectorial.
4. ⏳ **Juego completo.** Están los PNG en color, monocromo, fondo claro y oscuro. Falta el SVG.
5. ✅ **Archivos en el repositorio**, en `public/marca/`, generados por `scripts/generar-marca.mjs`.
6. ⏳ **Confirmar Pantone y CMYK** con prueba física antes del primer tiraje.
7. ✅ **Tokens de color aplicados** a `app/globals.css`, con el remapeo de los tokens semánticos
   de shadcn y la corrección de contraste del botón primario (§3).

### 7.1 Cómo se generaron los archivos actuales

`scripts/generar-marca.mjs` recorta los dos paneles de `Logo_PNA.png` y separa el fondo
proyectando cada píxel sobre las tintas conocidas, en vez de recortar por umbral. Resultado
medido, contra los archivos viejos:

| | Archivo viejo `_transparente` | `logo-color.png` generado |
|---|---|---|
| Píxeles semitransparentes | **19** | **66,695** |
| Colores opacos dominantes | `#B98D00`, `#FE8B00` — fuera de marca | `#FBC000`, `#00A3AD` — exactos |

Para volver a generarlos:

```bash
node scripts/generar-marca.mjs <ruta-a-Logo_PNA.png>
```

**Limitación conocida.** En `logo-color.png`, «GUANAJUATO» está calado en blanco y el blanco
coincide con el fondo del panel, así que esas letras quedan **transparentes**. Es correcto sobre
blanco o casi blanco —el único uso que §2 autoriza para esa versión— pero no sobre un color
medio. Para fondos oscuros está `logo-oscuro.png`, donde el blanco sí es opaco.

---

## 8. Resumen de una página

| | |
|---|---|
| **Amarillo** | `#FBC000` — superficie, nunca texto |
| **Turquesa** | `#00A3AD` — marca · `#007178` para texto |
| **Títulos** | Montserrat 600/700 |
| **Texto** | Geist 400/500, mínimo 16 px |
| **Manuscrita** | Solo carteles. Nunca en formularios ni documentos que se firmen. |
| **Área libre** | 9 % del ancho del logo, por los cuatro lados |
| **Mínimo** | 180 px en pantalla · 45 mm impreso |
| **Impresos** | Se diseñan en blanco y negro |
| **Pacientes** | Sin consentimiento escrito, no se publica ninguna imagen |
