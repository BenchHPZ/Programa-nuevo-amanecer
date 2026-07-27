import { NextResponse, type NextRequest } from "next/server";

import { consultarExpedientes, leerFiltros } from "@/lib/expedientes";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * RF-191: exporta el padrón de la jornada en CSV, respetando los filtros de
 * la pantalla de listado (RF-190).
 *
 * Es un Route Handler y no una server action porque lo que se devuelve es un
 * archivo con sus cabeceras, no una actualización de interfaz.
 */

/**
 * Excel abre CSV en la codificación local del sistema salvo que el archivo
 * empiece con BOM. Sin esto, "Muñoz" y "León" llegan rotas al padrón que
 * alguien va a imprimir. Es también lo que evita tener que meter `exceljs`
 * como dependencia solo para escribir texto separado por comas.
 */
const BOM = "﻿";

/**
 * Un campo que empieza con = + - @ lo interpreta Excel como fórmula. Los
 * nombres de este padrón vienen, entre otras vías, del formulario público
 * de pre-registro: es entrada de terceros que termina en un archivo que el
 * personal abre en su computadora. Se antepone un apóstrofo, que Excel
 * muestra como texto plano.
 */
function neutralizarFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = neutralizarFormula(String(valor));
  if (/[",\n\r;]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

const ENCABEZADOS = [
  "folio",
  "digito_verificador",
  "servicio",
  "estado_expediente",
  "dictamen",
  "fecha_dictamen",
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "fecha_nacimiento",
  "sexo",
  "curp",
  "telefono",
  "municipio",
  "estado",
  "creado_en",
];

export async function GET(request: NextRequest) {
  const supabase = await crearClienteServidor();

  // El middleware ya bloquea /admin a quien no sea administrativo, pero eso
  // es enrutamiento, no autorización. Esta ruta entrega el padrón completo:
  // se vuelve a verificar aquí, contra la base.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuario_perfil")
    .select("rol, estado")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.estado !== "activo" || perfil?.rol !== "administrativo") {
    return NextResponse.json({ error: "No autorizado para exportar." }, { status: 403 });
  }

  const jornada = await obtenerJornadaActiva();
  if (!jornada) {
    return NextResponse.json({ error: "No hay jornada activa." }, { status: 404 });
  }

  const filtros = leerFiltros(Object.fromEntries(request.nextUrl.searchParams));
  const { expedientes, error } = await consultarExpedientes(jornada.id, filtros);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const lineas = [ENCABEZADOS.join(",")];
  for (const exp of expedientes) {
    const p = exp.paciente;
    const folio = exp.folio?.find((f) => f.activo);
    const d = exp.dictamen_etapa1;

    lineas.push(
      [
        folio?.folio_texto,
        folio?.digito_verificador,
        folio?.servicio,
        exp.estado,
        d?.resultado,
        d?.fecha,
        p?.nombre,
        p?.apellido_paterno,
        p?.apellido_materno,
        p?.fecha_nacimiento,
        p?.sexo,
        p?.curp,
        p?.telefono,
        p?.municipio,
        p?.estado_geografico,
        exp.creado_en,
      ]
        .map(celda)
        .join(","),
    );
  }

  // Deja rastro de quién se llevó el padrón, cuándo y con qué filtros. Si
  // falla, se avisa en el log pero no se bloquea la exportación: durante la
  // jornada el archivo puede ser urgente, y una bitácora incompleta se
  // reconstruye — un padrón que no salió a tiempo, no.
  const filtrosAplicados: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) filtrosAplicados[clave] = valor;
  }

  const { error: errorAuditoria } = await supabase.rpc("registrar_exportacion", {
    p_jornada_id: jornada.id,
    p_filtros: filtrosAplicados,
    p_filas: expedientes.length,
  });
  if (errorAuditoria) {
    console.error("No se pudo auditar la exportación:", errorAuditoria.message);
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `padron-${jornada.clave}-${fecha}.csv`;

  return new NextResponse(BOM + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      // Contiene datos personales sensibles: que no quede en ninguna caché.
      "Cache-Control": "no-store, private",
    },
  });
}
