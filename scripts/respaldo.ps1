<#
.SYNOPSIS
  Respaldo manual de la base de datos (RF-194).

.DESCRIPTION
  Genera un respaldo con fecha en privado/respaldos/, que está excluido de git.

  Produce DOS archivos, y los dos hacen falta para restaurar:

    <marca>-esquema.sql   estructura, funciones, políticas RLS y triggers
    <marca>-datos.sql     el contenido de las tablas

  `supabase db dump` sin más volca SOLO el esquema. Un archivo así pesa poco,
  no da ningún error y parece un respaldo correcto — hasta el día que hay que
  restaurarlo y no trae ni un paciente. Por eso este script verifica que el
  volcado de datos realmente contenga filas antes de decir que terminó.

  Este script cubre el respaldo MANUAL del cierre de cada día. El respaldo
  automático diario NO lo hace este script: lo hace Supabase en el plan Pro.
  Ver docs/OPERACION.md §4.

.EXAMPLE
  .\scripts\respaldo.ps1 -Local
  .\scripts\respaldo.ps1 -CadenaConexion $env:SUPABASE_DB_URL
#>

[CmdletBinding()]
param(
  [string]$Destino = "privado/respaldos",
  [string]$CadenaConexion,
  [switch]$Local
)

$ErrorActionPreference = "Stop"

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not $Local -and -not $CadenaConexion) {
  Write-Error @"
Falta indicar qué base respaldar.

  Local:   .\scripts\respaldo.ps1 -Local
  Remota:  .\scripts\respaldo.ps1 -CadenaConexion "postgresql://..."

La cadena de conexión de produccion está en el panel de Supabase
(Project Settings -> Database). NO se guarda en el repositorio.
"@
  exit 1
}

if (-not (Test-Path $Destino)) {
  New-Item -ItemType Directory -Force -Path $Destino | Out-Null
  Write-Host "Carpeta creada: $Destino"
}

# Comprobación deliberada: si esta carpeta dejara de estar ignorada, un
# respaldo con datos reales de menores acabaría en un commit. Vale más
# abortar aquí que confiar en que nadie tocó el .gitignore.
$ignorado = git check-ignore $Destino 2>$null
if (-not $ignorado) {
  Write-Error "ABORTADO: '$Destino' no está excluido de git. Revisa .gitignore antes de continuar."
  exit 1
}

$marca = Get-Date -Format "yyyy-MM-dd-HHmm"
$archivoEsquema = Join-Path $Destino "$marca-esquema.sql"
$archivoDatos = Join-Path $Destino "$marca-datos.sql"

# Array simple, no splatting: `@origen` es splatting de cmdlet y no llega
# a un ejecutable nativo — el dump se ejecutaría sin saber contra qué base.
$origen = if ($Local) { @("--local") } else { @("--db-url", $CadenaConexion) }
$etiqueta = if ($Local) { "LOCAL de desarrollo" } else { "remota" }

Write-Host "Respaldando la base $etiqueta..."
Write-Host "  [1/2] esquema"
npx supabase db dump $origen -f $archivoEsquema
Write-Host "  [2/2] datos"
npx supabase db dump $origen --data-only -f $archivoDatos

function Confirmar-Volcado {
  param([string]$Ruta, [string]$Patron, [string]$Descripcion)

  if (-not (Test-Path $Ruta)) {
    Write-Error "No se generó $Ruta. Revisa la salida de arriba."
    exit 1
  }

  $coincidencias = (Select-String -Path $Ruta -Pattern $Patron -ErrorAction SilentlyContinue | Measure-Object).Count
  if ($coincidencias -eq 0) {
    Write-Error "ABORTADO: $Ruta no contiene $Descripcion. Ese respaldo NO sirve."
    exit 1
  }

  $mb = [math]::Round((Get-Item $Ruta).Length / 1MB, 2)
  Write-Host ("  OK  {0}  ({1} MB, {2} {3})" -f (Split-Path $Ruta -Leaf), $mb, $coincidencias, $Descripcion)
}

Write-Host ""
Confirmar-Volcado -Ruta $archivoEsquema -Patron "^CREATE TABLE" -Descripcion "tablas"
Confirmar-Volcado -Ruta $archivoDatos -Patron "^COPY |^INSERT INTO" -Descripcion "bloques de datos"

Write-Host ""
Write-Host "Respaldo completo en $Destino"
Write-Host ""
Write-Host "Falta lo que de verdad importa:"
Write-Host "  1. Copia LOS DOS archivos fuera de este equipo (disco externo o nube de la asociacion)."
Write-Host "  2. Una vez por jornada, prueba restaurarlos. Procedimiento en docs/OPERACION.md S4."
Write-Host ""
Write-Host "     OJO: estos volcados NO se restauran con psql sobre una base vacia."
Write-Host "     Dan por hechos los esquemas de Supabase (auth, storage, extensions)."
Write-Host "     El destino tiene que ser un proyecto Supabase con las migraciones aplicadas."
Write-Host ""
Write-Host "     Un respaldo que nunca se restauro no es un respaldo, es una suposicion."
