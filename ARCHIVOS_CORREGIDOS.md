# FHW v1.9 · Archivos para reemplazar

Reemplaza únicamente estos archivos conservando sus rutas:

- `app/dashboard.tsx`
- `app/xlsx-report.ts`
- `app/premium.css`
- `scripts/audit_project.py`
- `package.json`
- `package-lock.json`
- `public/sw.js`
- `public/assets/damos-seguimiento.webp`
- `public/assets/un-placer-haber-ayudado.webp`
- `public/data/juntemonos-mas.json`
- `AUDITORIA.md`
- `README.md`
- `ARCHIVOS_CORREGIDOS.md`

El workflow existente reconstruye automáticamente `public/data` y `docs`; no deben cargarse copias compiladas dentro de este paquete.

Validación final: `npm test && npm run lint && python3 scripts/audit_project.py`.
