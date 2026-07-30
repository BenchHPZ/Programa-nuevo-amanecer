# Logos de aliados institucionales y donantes

Esta carpeta guarda los logos de quienes aparecen en "Quién lo hace posible" de la página
pública (sedes, respaldo institucional, equipos quirúrgicos, voluntariado académico y empresas o
benefactores). **Hoy está vacía a propósito**: sin logo, la tarjeta se dibuja con la silueta de su
categoría y se ve bien. No hay ninguna prisa por llenarla.

## Antes de subir un logo

**El permiso es de la institución o empresa, no de la asociación.** Aparecer como aliado ya
requiere su visto bueno; publicar su logo es lo mismo, pero de su marca — mismo permiso a pedir,
no uno aparte. Sin permiso por escrito, no se sube el logo. La silueta no es un problema que
resolver.

## Formato

| | |
|---|---|
| Proporción | Libre — la mayoría de los logos son rectangulares, no se recortan (`object-contain`) |
| Fondo | Transparente de preferencia (PNG o SVG); si no, blanco liso |
| Tamaño mínimo | 200 px en su lado más corto |
| Formato | PNG, SVG o WebP optimizado |
| Peso | Por debajo de 100 KB |

## Cómo se conecta

El nombre del archivo se pone en el campo `logo` del aliado, en
[`config/contenido-landing.ts`](../../config/contenido-landing.ts):

```ts
{
  nombre: "Cardinal Health",
  categoria: "donante",
  logo: "/aliados/cardinal-health.png",
}
```

Estos logos **sí** se versionan en git — son material de comunicación institucional, como el
logotipo propio, no datos de pacientes.
