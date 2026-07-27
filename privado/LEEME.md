# Carpeta `privado/` — excluida del repositorio

**Todo lo que esté aquí dentro está en `.gitignore` y no se versiona.** Este archivo es la única
excepción, para que la estructura de carpetas quede documentada.

## Qué va aquí

| Ruta | Contenido |
|---|---|
| `privado/jornada.json` | Configuración real de la jornada: sede, dirección, fechas, contactos |
| `privado/catalogo/` | Catálogo real de campos entregado por la asociación |
| `privado/exportaciones/` | CSV y Excel generados desde el panel |
| `privado/respaldos/` | Dumps de base de datos |
| `privado/documentos/` | Escaneos descargados del almacenamiento |

## Qué NO va aquí

- **Llaves y secretos** → van en `.env.local`.
- **Estructura de configuración** → la plantilla con datos ficticios vive en
  `config/jornada.ejemplo.json`, que sí se versiona.

## Reglas

1. Nada de esta carpeta se copia a `docs/`, a un issue, ni a un mensaje.
2. Si necesitas compartir un ejemplo, **inventa los datos**. Nunca uses un paciente real.
3. Los respaldos que se saquen de aquí se guardan donde la asociación indique, no en equipos
   personales.

Ver [docs/CUMPLIMIENTO.md](../docs/CUMPLIMIENTO.md) para el marco legal que sustenta estas reglas.
