# Auditoría técnica · FHW

## Resultado

Estado final: **24/24 controles OK**.

| Frente | Antes | Versión corregida |
| --- | --- | --- |
| GitHub Actions | `sites-env.sh: Permission denied` · exit 126 | Ejecución independiente del bit ejecutable y normalización Linux en CI |
| GitHub Pages | Publicaba el README desde `/` | Sitio estático completo generado en `/docs` |
| Carga inicial de datos | 5.9 MB | 870 KB; histórico bajo demanda por mes |
| Render del detalle | Hasta 889 filas simultáneas | Máximo 100 filas visibles |
| Agrupación | Copia repetida de arreglos | Acumulación lineal con `Map` |
| Imágenes principales | 4.1 MB en PNG | 156 KB en WebP para interfaz |
| Navegación | Filtros sin cambio de nivel | Región abre DM; DM abre Tienda |
| PDF | Impresión genérica | Nombre por nivel/semana y vista ejecutiva A4 |

## Validación de información

- Regla: `SUM(FHW) / SUM(Bebidas Lobby)`; no se promedian porcentajes.
- Cruce único: `CeCo + Semana`.
- Sólo tiendas aplicables según el directorio.
- Ejemplo control: CeCo 38101, semana 30 = `59 / 3,111 = 1.8965%`.
- Último corte completo: semana 34.
- 29,033 registros publicados: 4,421 calculados y 24,612 históricos.
- Sin denominadores en cero y sin duplicados publicados.

## Archivos clave corregidos

| Archivo | Mejora |
| --- | --- |
| `scripts/build-verified.sh` | Elimina el error de permisos en GitHub Actions |
| `scripts/install-ci.sh` | Mismo arranque robusto en instalación controlada |
| `.github/workflows/validate.yml` | Orden de validación reproducible en Linux |
| `scripts/build_data.py` | Cruce Python, ponderación y carga histórica por mes |
| `scripts/build-pages.mjs` | Genera `/docs` listo para GitHub Pages |
| `scripts/audit_project.py` | 24 controles de datos, presupuesto y publicación |
| `app/dashboard.tsx` | Navegación en cascada, drill-down y PDF rápido |
| `app/globals.css` | Interfaz ejecutiva, compacta y responsive |
| `public/sw.js` | Caché compatible con la subruta `/FHW/` |
| `public/manifest.webmanifest` | PWA compatible con GitHub Pages |
| `tests/` | Pruebas de cálculo, carga y publicación estática |

## Comandos de control

```bash
python scripts/build_data.py
python -m unittest discover -s tests -p 'test_*.py' -v
npm run lint
npm run pages
node --test tests/rendered-html.test.mjs
python scripts/audit_project.py
```
