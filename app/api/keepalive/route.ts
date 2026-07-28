import { NextResponse } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Mitigación de la pausa por inactividad del plan gratuito de Supabase
 * (~7 días sin actividad). Esta app se usa en ráfagas —dos jornadas al
 * año— así que sin esto el proyecto podría estar dormido justo el día que
 * una familia intenta pre-registrarse.
 *
 * Vercel Cron (`vercel.json`, gratuito en el plan Hobby hasta una vez al
 * día) llama esta ruta. Se lee `jornada` con el cliente anónimo —es la
 * única tabla con política de lectura pública (RF-170/171)— para que la
 * mitigación no dependa de tener una sesión ni de la service role key.
 *
 * Esto NO sustituye el respaldo: solo evita que el proyecto se pause.
 * Ver docs/OPERACION.md §4.
 */
export async function GET() {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("jornada").select("id", { head: true, count: "exact" });

  if (error) {
    console.error("Keepalive: la lectura falló:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
