"use server";

import { filasImportables, validarFila, type FilaAnalizada } from "@/lib/importacion";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * RF-193. Dos pasos separados a propósito: primero se analiza y se enseña,
 * después —y solo si el administrativo confirma— se escribe. Cargar un CSV
 * a ciegas sobre el padrón en plena jornada es exactamente el error que este
 * flujo existe para evitar.
 */

interface ResultadoBusqueda {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  motivo: string;
}

export async function analizarImportacion(filas: Record<string, string>[]) {
  const supabase = await crearClienteServidor();
  const analizadas: FilaAnalizada[] = [];

  for (const [indice, datos] of filas.entries()) {
    const errores = validarFila(datos);
    const posiblesDuplicados: { nombre: string; motivo: string }[] = [];

    // Solo se busca duplicado si la fila es válida: en una fila rota los
    // criterios de búsqueda no son de fiar y el ruido estorbaría.
    if (errores.length === 0) {
      const { data } = await supabase.rpc("buscar_persona_similar", {
        p_curp: datos.curp || undefined,
        p_nombre: datos.nombre || undefined,
        p_apellido_paterno: datos.apellido_paterno || undefined,
        p_apellido_materno: datos.apellido_materno || undefined,
        p_fecha_nacimiento: datos.fecha_nacimiento || undefined,
        p_telefono: datos.telefono || undefined,
      });

      const vistos = new Set<string>();
      for (const r of (data ?? []) as unknown as ResultadoBusqueda[]) {
        const nombre = `${r.nombre} ${r.apellido_paterno} ${r.apellido_materno ?? ""}`.trim();
        if (vistos.has(nombre)) continue;
        vistos.add(nombre);
        posiblesDuplicados.push({ nombre, motivo: r.motivo });
      }
    }

    analizadas.push({
      linea: indice + 2, // +1 por el encabezado, +1 porque las líneas empiezan en 1
      datos,
      errores,
      posiblesDuplicados,
    });
  }

  return { filas: analizadas };
}

export async function ejecutarImportacion(filas: Record<string, string>[]) {
  const jornada = await obtenerJornadaActiva();
  if (!jornada) return { error: "No hay jornada activa: no se sabe a cuál importar." };

  // Se revalida en el servidor. Las filas llegan del cliente, que pudo
  // mandar cualquier cosa; y aunque no fuera así, el archivo pudo cambiar
  // entre la previsualización y la confirmación.
  const { filas: analizadas } = await analizarImportacion(filas);
  const importables = filasImportables(analizadas);

  const supabase = await crearClienteServidor();
  let importadas = 0;
  const fallidas: { linea: number; error: string }[] = [];

  for (const fila of importables) {
    const d = fila.datos;
    const { error } = await supabase.rpc("importar_expediente_contingencia", {
      p_jornada_id: jornada.id,
      p_paciente: {
        nombre: d.nombre,
        apellido_paterno: d.apellido_paterno,
        apellido_materno: d.apellido_materno ?? "",
        fecha_nacimiento: d.fecha_nacimiento,
        sexo: d.sexo.toUpperCase(),
        curp: d.curp ?? "",
        telefono: d.telefono ?? "",
        municipio: d.municipio ?? "",
        estado_geografico: d.estado_geografico ?? "",
      },
      p_responsable: {
        nombre: d.responsable_nombre,
        apellido_paterno: d.responsable_apellido_paterno,
        apellido_materno: d.responsable_apellido_materno ?? "",
        telefono: d.responsable_telefono ?? "",
        curp: d.responsable_curp ?? "",
      },
      p_parentesco: d.parentesco,
    });

    // Una fila que falla no detiene a las demás: en contingencia importa
    // meter lo que sí se puede y reportar con precisión lo que no.
    if (error) fallidas.push({ linea: fila.linea, error: error.message });
    else importadas += 1;
  }

  return {
    importadas,
    omitidas: analizadas.length - importables.length,
    fallidas,
  };
}
