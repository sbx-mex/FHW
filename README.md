# FHW · Cada Taza Cuenta

Dashboard ejecutivo PWA para medir el avance de vajilla reutilizable en bebidas consumidas dentro de tienda.

## Regla del indicador

```text
Cada Taza Cuenta = SUM(FHW) / SUM(Bebidas Lobby)
Objetivo: mayor a 10%
```

FHW suma `Vaso Vidrio`, `Vaso Vidrio N` y `Taza Bebida Cal`. Para DM y Región el porcentaje siempre se recalcula con las sumas de sus tiendas; nunca se usa un promedio de porcentajes.

## Alcance de la versión 1

- Pestañas **Tienda**, **DM** y **Región**.
- Filtros por Mes, Semana, Región, DM y nombre de tienda.
- KPIs ponderados, tendencia, lectura ejecutiva, Top y Bottom.
- Histórico directo de semanas 1–29 y cálculo automático desde semana 30.
- Semana incompleta protegida: sólo se publica cuando existen FHW y Bebidas Lobby.
- Vista lista para **Descargar PDF** mediante el diálogo de impresión.
- Descarga del `Toolkit_Cada_Taza_Cuenta.pdf`.
- PWA instalable y lectura en caché.
- Auditoría JSON, pruebas unitarias y validación automática en GitHub Actions.

## Actualización semanal

1. Sustituye `input/CTC_FHW.csv` y `input/CTC_Bebidas_Lobby.csv`.
2. Conserva sus nombres; el motor detecta el encabezado aunque el CSV incluya texto de Business Intelligence antes de la tabla.
3. Ejecuta:

```bash
python -m pip install -r requirements.txt
python scripts/build_data.py
npm run audit
npm run build
```

La salida web se genera en `public/data/fhw-dashboard.json` y la reconciliación en `public/data/data-audit.json`.

El histórico se divide por mes en `public/data/history/`; así el tablero abre con menos de 1 MB y sólo descarga el mes solicitado.

## Publicación en GitHub Pages

```bash
npm run pages
```

La versión lista para publicar queda en `docs/`. En **Settings → Pages**, selecciona `Deploy from a branch`, rama `main` y carpeta `/docs`.

## Archivos de entrada

| Archivo | Uso |
| --- | --- |
| `CTC_FHW.csv` | Numerador desde semana 30. |
| `CTC_Bebidas_Lobby.csv` | Denominador desde semana 30. |
| `Directorio_FHW.xlsx` | Nombre de tienda, Región, DM y aplicación. Si existe `Aplica`, sólo acepta `Sí`; si no, usa `Estatus = Abierta`. |
| `FHW_Sem1_29.csv` | Histórico opcional con `Año, Semana, Ceco, FHW`; sustituye el histórico del libro de referencia. |
| `Base_Año_Mes_Sem.xlsx` | Calendario opcional con `Año, Mes, Semana`; sustituye el calendario del libro de referencia. |

El `Directorio_FHW.xlsx` incluido conserva como referencia validada el Directorio, calendario y CTC histórico de Foco2026. Puede reemplazarse por el archivo operativo definitivo sin cambiar el código.

## Validaciones incluidas

- Tienda Ángel, semana 30: `59 / 3,111 = 1.8965%`.
- Última semana completa: 34.
- Semana 35 se excluye hasta recibir Bebidas Lobby.
- Cruce único por `CeCo + Semana`.
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

Diseñado por Jesus Alfredo Lopez Ramirez, Especialista de Sustentabilidad, y Enrique César Flores, Gerente de Distrito.

La información publicada es propiedad de la marca y está prohibida su divulgación.
