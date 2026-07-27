/** RF-162: comprimir en el navegador antes de subir, para controlar el almacenamiento. */
export async function comprimirImagen(
  archivo: File,
  { maxDimension = 1600, calidad = 0.75 }: { maxDimension?: number; calidad?: number } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen para comprimir.");
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen."))),
      "image/jpeg",
      calidad,
    );
  });
}
