import { redirect } from "next/navigation";

import { consultarExpedientes, leerFiltros, SIN_DICTAMEN, type FiltrosExpediente } from "@/lib/expedientes";
import { obtenerJornadaActiva } from "@/lib/jornada";
import { verificarEsAdministrativo } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Logo } from "@/components/marca/logo";
import { ETIQUETA_ESTADO, ETIQUETA_RESULTADO, ETIQUETA_SERVICIO } from "@/app/admin/expedientes/filtros";

import { BotonImprimir } from "../boton-imprimir";

/**
 * Enlazada desde /admin/expedientes (y desde los conteos de /admin), no
 * desde /admin propiamente — el middleware solo exige "activo" para
 * /imprimir/*, no administrativo. Igual que ya razona
 * app/admin/exportar/route.ts: el enrutamiento no es autorización, así que
 * se reverifica el rol aquí mismo.
 */
function describirFiltros(f: FiltrosExpediente): string | null {
  const partes: string[] = [];
  if (f.estado) partes.push(ETIQUETA_ESTADO[f.estado] ?? f.estado);
  if (f.dictamen === SIN_DICTAMEN) partes.push("Sin dictamen");
  else if (f.dictamen) partes.push(ETIQUETA_RESULTADO[f.dictamen] ?? f.dictamen);
  if (f.servicio) partes.push(ETIQUETA_SERVICIO[f.servicio] ?? f.servicio);
  if (f.desde || f.hasta) partes.push(`Registrados ${f.desde ?? "…"} a ${f.hasta ?? "…"}`);
  if (f.dictaminadoDesde || f.dictaminadoHasta) {
    partes.push(`Dictaminados ${f.dictaminadoDesde ?? "…"} a ${f.dictaminadoHasta ?? "…"}`);
  }
  return partes.length > 0 ? partes.join(" · ") : null;
}

export default async function PaginaImprimirExpedientes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const autorizado = await verificarEsAdministrativo();
  if (!autorizado.ok) redirect("/auth/sin-permiso");

  const sp = await searchParams;
  const filtros = leerFiltros(sp);
  const jornada = await obtenerJornadaActiva();

  if (!jornada) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-muted-foreground">
        No hay jornada activa — nada que imprimir.
      </div>
    );
  }

  const { expedientes, total } = await consultarExpedientes(jornada.id, filtros);

  // Es una lectura del padrón completo, igual que el CSV — se audita igual,
  // solo se distingue por `medio`. Si falla, no bloquea la vista: durante la
  // jornada la lista puede ser urgente.
  const supabase = await crearClienteServidor();
  const filtrosAplicados: Record<string, string> = { medio: "impresion" };
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) filtrosAplicados[clave] = valor;
  }
  const { error: errorAuditoria } = await supabase.rpc("registrar_exportacion", {
    p_jornada_id: jornada.id,
    p_filtros: filtrosAplicados,
    p_filas: expedientes.length,
  });
  if (errorAuditoria) {
    console.error("No se pudo auditar la impresión del padrón:", errorAuditoria.message);
  }

  const descripcion = describirFiltros(filtros);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex justify-end print:hidden">
        <BotonImprimir />
      </div>

      <style>{`@page { size: letter; margin: 0.75in; }`}</style>
      <div className="space-y-6 border p-8 print:border-0">
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Monocromo negro: se imprime en láser B/N y se fotocopia (§6). */}
          <Logo variante="negro" ancho={180} />
          <h1 className="text-xl font-semibold">Programa Nuevo Amanecer, A.C.</h1>
          <p className="text-muted-foreground">
            {jornada.nombre} — {jornada.sede}
          </p>
          <p className="mt-2 font-medium">{descripcion ?? "Padrón completo de la jornada"}</p>
          <p className="text-sm text-muted-foreground">
            {total} persona{total === 1 ? "" : "s"} — impreso el{" "}
            {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
        </div>

        {expedientes.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Ningún expediente coincide con estos filtros.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1 pr-2 font-medium">#</th>
                <th className="py-1 pr-2 font-medium">Nombre</th>
                <th className="py-1 pr-2 font-medium">Nacimiento</th>
                <th className="py-1 pr-2 font-medium">Estado / dictamen</th>
                <th className="py-1 font-medium">Folio</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((exp, i) => {
                const p = exp.paciente;
                const folio = exp.folio?.find((f) => f.activo);
                const dictamen = exp.dictamen_etapa1;
                return (
                  <tr key={exp.id} className="border-b last:border-0">
                    <td className="py-1 pr-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-1 pr-2">
                      {p ? `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ""}` : "—"}
                    </td>
                    <td className="py-1 pr-2">{p?.fecha_nacimiento ?? "—"}</td>
                    <td className="py-1 pr-2">
                      {dictamen
                        ? (ETIQUETA_RESULTADO[dictamen.resultado] ?? dictamen.resultado)
                        : (ETIQUETA_ESTADO[exp.estado] ?? exp.estado)}
                    </td>
                    <td className="py-1">
                      {folio ? `${folio.folio_texto}-${folio.digito_verificador}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
