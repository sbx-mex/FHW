# FHW · Cada Taza Cuenta

La exportación se confirma una vez y se descarga directamente: PDF ejecutivo horizontal de una hoja o Excel Dashboard. Al finalizar, el aviso sólo permite cerrar.

Dashboard ejecutivo PWA para medir el avance de vajilla reutilizable en bebidas consumidas dentro de tienda.

## Regla del indicador

```text
Cada Taza Cuenta = promedio por tienda de (FHW / Bebidas Lobby)
Objetivo: mayor a 10%
```

FHW suma `Vaso Vidrio`, `Vaso Vidrio N` y `Taza Bebida Cal`. Para DM y Región el porcentaje siempre se recalcula con las sumas de sus tiendas; nunca se usa un promedio de porcentajes.

## Alcance de la versión 1.9

- Pestañas **Tienda**, **DM** y **Región**.
- Mes y Semana visibles como filtros rápidos de selección múltiple; Región y DM son filtros únicos encadenados.
- Promedio por tienda, tendencia, lectura ejecutiva, Top y Bottom.
- Tendencia completa enero–agosto: FHW / Bebidas Lobby por tienda en semanas 1–34 y operación continua desde semana 35.
- Semana incompleta protegida: sólo se publica cuando existen FHW y Bebidas Lobby.
- Menú **Descargar** con confirmación, PDF ejecutivo horizontal de una página y Excel XLSX con hojas `Dashboard`, `Detalle` y `Tendencia`.
- Descarga del `Toolkit_Cada_Taza_Cuenta.pdf`.
- Inicio estable en GitHub Pages: sin caché persistente de JS/CSS para que cada publicación cargue sus archivos vigentes.
- Auditoría JSON, pruebas unitarias y validación automática en GitHub Actions.

## Actualización semanal

1. Consulta `input/ESTADO_DE_CARGA.md` y sustituye únicamente `input/CTC_FHW.csv` y `input/CTC_Bebidas_Lobby.csv`.
2. Conserva sus nombres; el motor detecta el encabezado aunque el CSV incluya texto de Business Intelligence antes de la tabla.
3. Ejecuta:

```bash
python -m pip install -r requirements.txt
python scripts/build_data.py
npm run audit
npm run build
```

La salida web se genera en `public/data/fhw-dashboard.json` y la reconciliación en `public/data/data-audit.json`.

El estado legible de cada fuente queda en `public/data/input-status.json`. Si el corte no se publica, descarga `public/data/revision/pending-weeks.json`: identifica los CeCos que sólo existen en FHW, sólo existen en Lobby y los que no están en el directorio.

El histórico se divide por mes en `public/data/history/`; así el tablero abre rápido y sólo descarga los meses seleccionados.

## Publicación en GitHub Pages

```bash
npm run pages
```

La versión lista para publicar queda en `docs/`. En **Settings → Pages**, selecciona `Deploy from a branch`, rama `main` y carpeta `/docs`.

## Archivos de entrada

| Archivo | Uso |
| --- | --- |
| `CTC_FHW_1_34.csv` | Numerador histórico 2026, semanas 1–34. |
| `CTC_Bebidas_Lobby_1_34.csv` | Denominador histórico 2026, semanas 1–34. |
| `CTC_FHW.csv` | Numerador operativo desde semana 35. |
| `CTC_Bebidas_Lobby.csv` | Denominador operativo desde semana 35. |
| `Directorio_FHW.xlsx` | Nombre de tienda, Región, DM y aplicación. Si existe `Aplica`, sólo acepta `Sí`; si no, usa `Estatus = Abierta`. |
| `Base_Año_Mes_Sem.xlsx` | Calendario opcional con `Año, Mes, Semana`; sustituye el calendario del libro de referencia. |

No conservar `FHW_Sem1_29.csv`; el workflow manual **Retirar motor histórico anterior** lo elimina después de validar el nuevo motor.

El `Directorio_FHW.xlsx` incluido usa `CeCo`, `Tienda`, `Región`, `DM` y `Aplica`; sólo se publican filas con `Aplica = Sí`.

## Validaciones incluidas

- Histórico: semanas 1–34; operación: semana 35 en adelante.
- Cruce único por `CeCo + Año + Semana`.
- Los CSV históricos pueden incluir otros años, pero sólo se publica 2026.
- Rechazo de denominadores en cero.
- Nombres de tienda obligatorios.
- Límite de 25 MB por archivo/carpeta y máximo 100 entradas por carpeta del paquete.

## Desarrollo

Requiere Node.js 22+ y Python 3.11+.

```bash
npm ci
python -m pip install -r requirements.txt
python scripts/build_data.py
npm run dev
```

## Referencias de diseño

La solución combina la lectura ejecutiva y auditoría determinista de `Foco2026`, el enfoque de ranking de `CeNtro-Partner` y el storytelling/PWA de `Esfuerzo_Operativo`, con identidad propia de FHW.

## Créditos

Diseñado por Jesus Alfredo Lopez Ramirez & Enrique César Flores.

La información publicada es propiedad de la marca y está prohibida su divulgación.
