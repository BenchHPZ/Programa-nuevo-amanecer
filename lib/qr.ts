import QRCode from "qrcode";

/** SVG del folio (RF-153): insertable directo en la página, sin canvas ni servicio externo. */
export async function generarQrSvg(texto: string): Promise<string> {
  return QRCode.toString(texto, { type: "svg", margin: 1, width: 220 });
}
