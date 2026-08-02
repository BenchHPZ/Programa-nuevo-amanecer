/**
 * Contenido institucional de la landing pública.
 *
 * Todo vive aquí y no incrustado en el JSX por una razón práctica: `CONTACTO`
 * es la fuente única para el sitio y para los documentos legales (aviso de
 * privacidad, plantillas de consentimiento), y los nombres de donantes y
 * aliados normalmente requieren convenio o permiso expreso de cada
 * organización. Tenerlos en un solo archivo permite corregirlos —o
 * quitarlos— en un renglón, sin tocar componentes ni documentos legales por
 * separado.
 *
 * Los hechos vienen de docs/HISTORIA.md. **No se publica** el apartado de
 * retos de ese documento (opacidad financiera, sucesión del liderazgo, falta
 * de seguimiento formal): es análisis de terceros a partir de prensa, no
 * comunicación de la asociación.
 *
 * Tono: docs/MANUAL-IMAGEN.md §5. Español de México, de usted, frases cortas.
 * «Niña o niño con labio y/o paladar hendido», nunca «malformación» ni
 * «beneficiario». Se nombra que es gratuito sin pedir gratitud.
 */

export const ORGANIZACION = {
  nombreLegal: "Programa Nuevo Amanecer, A.C.",
  nombreCorto: "Programa Nuevo Amanecer",
  lema: "Desde 1984, cuidando la sonrisa de niñas y niños con labio y paladar hendido.",
  fundacion: 1984,
};

export const CIFRAS = [
  { valor: "+40 años", detalle: "de jornadas ininterrumpidas desde 1984" },
  { valor: "+4,700", detalle: "procedimientos quirúrgicos realizados" },
  { valor: "~200", detalle: "niñas y niños atendidos cada año" },
  { valor: "2", detalle: "jornadas al año, cada seis meses" },
];

export const SERVICIOS = [
  "Cierre de labio hendido y corrección nasal, desde los 3 meses de edad.",
  "Cierre de paladar hendido, a partir del año de edad.",
  "Injerto óseo de encía, entre los 5 y los 10 años.",
  "Cirugía de faringe para mejorar el habla.",
  "Rinoplastia, alrededor de los 15 años.",
  "Colocación de tubos de ventilación en el oído.",
  "Láser para cicatrices posteriores a la cirugía.",
  "Terapia de lenguaje, ortodoncia de seguimiento y acompañamiento psicosocial.",
];

/**
 * Cómo funciona la jornada, en el lenguaje de una familia que llega sin saber
 * qué esperar. Coincide con el proceso real de Etapa 1 y Etapa 2.
 */
export const PASOS = [
  {
    titulo: "1 - Revisión preliminar",
    texto:
      "Durante una semana, personal médico revisa a cada paciente y decide si es candidato a cirugía o a tratamiento láser. A quien es candidato se le entrega un folio.",
  },
  {
    titulo: "2 - Revisión especializada",
    texto:
      "Alrededor de un mes después, especialistas hacen la valoración completa y se programa el quirófano. El folio de la primera revisión es la entrada.",
  },
  {
    titulo: "3 - Intervenciones médicas",
    texto:
      "La cirugía y los tratamientos estéticos se realizan sin costo para la familia. Siempre con el apoyo de las diversas instituciones y los varios benefactores que siempre nos han apoyado.",
  },
  {
    titulo: "3 - Seguimiento",
    texto:
      "El acompañamiento continua. Tenemos aliados que apoyan con tratamientos auxiliares: terapia de lenguaje, ortodoncia, nutrición, psicología, entre otros",
  },
  {
    titulo: "🔁 Repetimos 🔁",
    texto:
      "Este es un trabajo largo, a muchas personas las vemos por varios años y tras múltiples intervenciones. Cada seis meses se repite el ciclo."
  }
];

/**
 * Instituciones aliadas, tomadas de docs/COLABORADORES.md, que es la fuente
 * con verificación explícita. Incluye también a empresas y benefactores
 * (categoría `donante`) — antes vivían aparte, en un arreglo de puros
 * nombres; se mezclan aquí para que reciban el mismo trato de tarjeta.
 *
 * La **sede no se fija aquí**: sale de `jornada.sede` en la base, porque ha
 * cambiado. El ISSSTE fue la sede de 1984 a 2024 —reconocido con placa a los
 * 40 años— y las jornadas recientes han sido en el Hospital General. Dar por
 * sentada una sede en el código obliga a un despliegue cada vez que se mueva.
 *
 * Conviene confirmar con cada institución antes de salir a producción:
 * aparecer como aliado en un sitio público suele requerir su visto bueno.
 * Publicar su **logo** es lo mismo, pero de su marca: mismo permiso a pedir,
 * no uno aparte. Sin logo, la tarjeta se ve bien con la silueta de su
 * categoría — no hay prisa por conseguirlos todos.
 */
export type CategoriaAliado = "sede" | "institucional" | "quirurgico" | "academico" | "donante";

export const ETIQUETA_CATEGORIA: Record<CategoriaAliado, string> = {
  sede: "Sedes hospitalarias",
  institucional: "Respaldo institucional",
  quirurgico: "Equipos quirúrgicos que suman",
  academico: "Voluntariado académico y estudiantil",
  donante: "Empresas y benefactores",
};

export const ALIADOS_INSTITUCIONALES: {
  nombre: string;
  /** Sedes y hospitales sí lo tienen; un donante no siempre necesita uno. */
  aporte?: string;
  categoria: CategoriaAliado;
  /** Ruta en /public/aliados. Si falta, se dibuja la silueta de la categoría. */
  logo?: string;
}[] = [
  {
    nombre: "Clínica Hospital ISSSTE Guanajuato",
    aporte: "Sede desde 1984 y durante cuarenta años: quirófanos, instalaciones y personal",
    categoria: "sede",
  },
  {
    nombre: "Hospital General de Guanajuato",
    aporte: "Sede de las jornadas recientes: cirugía pediátrica, anestesia y terapias",
    categoria: "sede",
  },
  {
    nombre: "Fundación Hospitales MAC",
    aporte: "Sede ocasional de las jornadas extras: quirófanos, material quirúrgico, hospitalización, personal enfermería",
    categoria: "sede",
  },
  {
    nombre: "Clínica Médica Guanajauto",
    aporte: "Sede principal de actuación, concebida como espacio polivalente de actividades rutinarias y especializadas",
    categoria: "sede",
  },
  {
    nombre: "Secretaría de Salud de Guanajuato",
    aporte: "Coordinación estatal, difusión y organización de las jornadas",
    categoria: "institucional",
  },
  {
    nombre: "DIF Municipal Guanajuato",
    aporte: "Acompañamiento psicosocial y terapia de lenguaje para las familias",
    categoria: "institucional",
  },
  {
    nombre: "Patronato del albergue Hospital General de Guanajuato",
    aporte: "Alojamiento y alimentación para las familias durante la jornada",
    categoria: "institucional",
  },
  {
    nombre: "Asoceación Mexicana de Diabetes Santa Fe de Guanajuato",
    aporte: "Apoyo incondicional en salúd preventiva y detección temprana, además de atención a familias",
    categoria: "institucional",
  },
  {
    nombre: "Instituto de Cirugía Plástica, Hospital Ángeles CDMX",
    aporte: "Cirujanos plásticos y especialistas en cada campaña",
    categoria: "quirurgico",
  },
  {
    nombre: "Hospital 20 de Noviembre, ISSSTE CDMX",
    aporte: "Cirugía plástica y maxilofacial en malformaciones craneofaciales",
    categoria: "quirurgico",
  },
  {
    nombre: "Instituto de Cirugía Reconstructiva de Jalisco",
    aporte: "Cirugías complejas de paladar e injerto óseo",
    categoria: "quirurgico",
  },
  {
    nombre: "Hospital Civil Fray Antonio Alcalde, Guadalajara",
    aporte: "Cirujanos plásticos pediátricos voluntarios",
    categoria: "quirurgico",
  },
  {
    nombre: "Hospital General de México",
    aporte: "Anestesiología y cuidados postoperatorios",
    categoria: "quirurgico",
  },
  {
    nombre: "División de Ciencias Naturales y Exactas - Universidad de Guanajuato",
    aporte: "Servicio social de estudiantes de enfermería",
    categoria: "academico",
  },
  {
    nombre: "Cardinal Health",
    categoria: "donante",
  },
  {
    nombre: "Medtronic",
    categoria: "donante",
  },
  {
    nombre: "Fundación Liomont",
    categoria: "donante",
  },
];

/**
 * Salón de la fama: reconocimiento permanente a quien sostiene el programa.
 *
 * No es un directorio del equipo — es agradecimiento, y por eso no se depura
 * cuando alguien deja de participar: se le añade hasta cuándo colaboró.
 *
 * ⚠ **`silueta` se declara, nunca se deduce del nombre.** Es un dato de la
 * persona; adivinarlo por cómo se llama es justo el error que no cabe en una
 * sección cuyo propósito es honrarla. Ante la duda, se pregunta.
 *
 * ⚠ **Foto y enlace necesitan el permiso de la persona**, no el de la
 * asociación. Aplica igual a los benefactores particulares. Sin foto, la
 * tarjeta se ve bien con la silueta: no hay prisa por llenarlas.
 */
export interface Reconocimiento {
  nombre: string;
  papel: string;
  institucion?: string;
  /** "1984", "1984–presente". Deja ver la permanencia, que es el punto. */
  desde?: string;
  silueta: "femenina" | "masculina";
  /** Ruta en /public/equipo. Si falta, se dibuja la silueta. */
  foto?: string;
  enlace?: { etiqueta: string; url: string };
}

export const SALON_DE_LA_FAMA: Reconocimiento[] = [
  {
    nombre: "Dr. Miguel Javier Covarrubias Mata",
    papel: "Fundador y presidente de la asociación",
    institucion: "Nuevo Amanecer, A.C.",
    desde: "1984 – presente",
    silueta: "masculina",
  },
  {
    nombre: "Dr. José Abel de la Peña Salcedo",
    papel: "Cirujano plástico, coordinador quirúrgico",
    institucion: "Instituto de Cirugía Plástica, CDMX",
    desde: "Cerca de tres décadas",
    silueta: "masculina",
  },
  {
    nombre: "Dr. Juan Eduardo Pérez de la Torre",
    papel: "Cirujano plástico pediátrico, voluntario",
    institucion: "Especialista en labio y paladar hendido",
    silueta: "masculina",
  },
  {
    nombre: "Familia Ledezma",
    papel: "Benefactores del programa",
    institucion: "Apoyo financiero y logístico",
    silueta: "masculina",
  },
];

/**
 * Preguntas frecuentes.
 *
 * Salen de lo que el personal responde una y otra vez el día de la jornada
 * (docs/OPERACION.md §6) y de las reglas de negocio. Incluyen qué papeles
 * traer: la gente lo busca aquí, no en una sección aparte.
 *
 * Tono de docs/MANUAL-IMAGEN.md §5: de usted, frases cortas. **Nunca se
 * promete un resultado quirúrgico** — quien decide es un médico, y decirlo
 * claro evita una expectativa injusta.
 */
export const PREGUNTAS_FRECUENTES = [
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "Nada. La valoración y la cirugía son gratuitas. No se cobra consulta, ni estudios, ni quirófano, ni honorarios médicos.",
  },
  {
    pregunta: "¿Necesito seguro médico o ser derechohabiente?",
    respuesta:
      "No. No hace falta IMSS, ISSSTE ni seguro de ningún tipo, ni pertenecer a ninguna institución.",
  },
  {
    pregunta: "¿Qué papeles debo llevar?",
    respuesta:
      "Acta de nacimiento y CURP del paciente, identificación oficial del adulto responsable, comprobante de domicilio y los estudios médicos previos que tenga. Si le falta alguno, venga de todas formas: se registra lo que traiga y lo pendiente se completa después.",
  },
  {
    pregunta: "¿Tiene que acompañarme un adulto?",
    respuesta:
      "Sí, siempre. Todo paciente necesita un adulto responsable que lo acompañe y firme, aunque el paciente sea mayor de edad. Sin acompañante no se puede completar el registro.",
  },
  {
    pregunta: "¿Y si no tengo CURP?",
    respuesta:
      "Se puede registrar sin ella. El sistema identifica al paciente por su nombre, su fecha de nacimiento y su sexo.",
  },
  {
    pregunta: "¿Desde qué edad se puede operar?",
    respuesta:
      "El cierre de labio se hace desde los 3 meses y el de paladar a partir del año. Hay procedimientos para edades mayores, como el injerto de encía entre los 5 y los 10 años. La edad correcta para cada caso la determina el médico.",
  },
  {
    pregunta: "¿Me operan el mismo día?",
    respuesta:
      "No. Son dos momentos distintos. En la primera revisión un médico valora el caso y, si es candidato, le entrega un folio. La cirugía ocurre en la segunda revisión, alrededor de mes y medio después.",
  },
  {
    pregunta: "¿Cuánto tiempo me va a tomar?",
    respuesta:
      "El registro y la valoración toman buena parte de la mañana. Conviene llegar temprano, con tiempo, y traer algo de comer para el paciente si es niña o niño pequeño.",
  },
  {
    pregunta: "¿Qué pasa si no soy candidato?",
    respuesta:
      "El médico le explicará por qué y qué sigue. En algunos casos se recomienda regresar en seis meses, cuando las condiciones sean mejores; en otros se le orienta hacia dónde acudir. Se le entrega una constancia por escrito de lo que se resolvió.",
  },
  {
    pregunta: "¿Puedo registrar a alguien antes de ir?",
    respuesta:
      "Sí. El pre-registro en esta página aparta sus datos y agiliza el trámite el día de la jornada, pero no es una cita ni garantiza un lugar: hay que presentarse igual.",
  },
];

/**
 * Línea de tiempo. Datos de docs/HISTORIA.md y docs/COLABORADORES.md.
 * Se muestra en la landing como lista con marcas, no como mermaid: el
 * diagrama sería idéntico y obligaría a cargar una librería en el navegador.
 */
export const HITOS = [
  {
    anio: "1984",
    titulo: "La primera campaña",
    texto: "Cinco pacientes en la Clínica del ISSSTE de Guanajuato.",
  },
  {
    anio: "1985",
    titulo: "Quince niñas y niños",
    texto: "El programa se repite y crece; se realizan dos jornadas en el año.",
  },
  {
    anio: "1986",
    titulo: "Cada seis meses",
    texto: "La demanda obliga a hacerlo semestral. Al tercer año se atiende cerca de cien por edición.",
  },
  {
    anio: "2024",
    titulo: "Cuarenta años",
    texto: "Más de 4,700 procedimientos acumulados. Una placa en la Clínica del ISSSTE reconoce cuatro décadas de apoyo.",
  },
  {
    anio: "2026",
    titulo: "La jornada sigue",
    texto: "Noventa y cuatro pacientes atendidos en el Hospital General de Guanajuato.",
  },
];

/**
 * Datos de contacto reales de la asociación — fuente única para el sitio y
 * para los documentos legales (aviso de privacidad, plantillas de
 * consentimiento): `correo`/`telefono` son también el canal de contacto
 * para ejercer derechos ARCO. Cambiar un dato aquí lo actualiza en todos
 * lados a la vez.
 *
 * El teléfono de la Clínica ISSSTE que aparece en docs/HISTORIA.md es de la
 * SEDE, no de la asociación: no se usa aquí.
 */
export const CONTACTO = {
  correo: "contacto@nuevoamanecergto.org",
  telefono: "(+52) 4735971365",
  domicilio: "Guanajuato, Guanajuato",
  horario: "Atención en horario de oficina - Paciencia con nuestros voluntarios",
};
