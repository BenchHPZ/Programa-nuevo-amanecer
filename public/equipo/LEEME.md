# Fotografías del salón de la fama

Esta carpeta guarda las fotos de quienes aparecen en el salón de la fama de la página pública.
**Hoy está vacía a propósito**: sin foto, la tarjeta se dibuja con una silueta y se ve bien.
No hay ninguna prisa por llenarla.

## Antes de subir una foto

**El permiso es de la persona, no de la asociación.** Publicar el rostro y el nombre de alguien
en un sitio público es tratamiento de datos personales: hace falta que esa persona lo autorice,
y que sepa dónde se va a publicar. Vale igual para el personal médico, el voluntariado y los
benefactores.

Si no hay permiso por escrito, no se sube la foto. La silueta no es un problema que resolver.

## Formato

| | |
|---|---|
| Proporción | Cuadrada (1:1). Se recorta en círculo |
| Tamaño mínimo | 400 × 400 px |
| Formato | JPG optimizado, o WebP |
| Peso | Por debajo de 150 KB |
| Encuadre | Rostro centrado, con aire arriba |

## Cómo se conecta

El nombre del archivo se pone en el campo `foto` de la persona, en
[`config/contenido-landing.ts`](../../config/contenido-landing.ts):

```ts
{
  nombre: "Dra. Ejemplo Apellido",
  papel: "Anestesióloga",
  silueta: "femenina",       // se sigue declarando: es el respaldo si la foto falla
  foto: "/equipo/ejemplo-apellido.jpg",
}
```

Estas fotos **sí** se versionan en git. No son datos de pacientes: son material de comunicación
institucional, como el logotipo. Lo que nunca entra al repositorio es cualquier imagen de un
paciente — ver [`docs/MANUAL-IMAGEN.md`](../../docs/MANUAL-IMAGEN.md) §5.
