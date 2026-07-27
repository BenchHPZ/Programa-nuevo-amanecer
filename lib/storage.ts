import { crearClienteServidor } from "./supabase/server";

/** RF-165: nunca URL pública — siempre firmada y de corta duración. */
export async function urlFirmadaPapeleria(path: string, segundosValidez = 300) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.storage.from("papeleria").createSignedUrl(path, segundosValidez);
  return data?.signedUrl ?? null;
}
