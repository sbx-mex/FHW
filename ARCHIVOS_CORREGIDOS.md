# FHW v1.10 · Archivos para reemplazar

Reemplaza únicamente estos archivos conservando sus rutas:

- `app/dashboard.tsx`
- `app/pdf-report.ts`
- `scripts/audit_project.py`
- `package.json`
- `package-lock.json`
- `public/sw.js`
- `AUDITORIA.md`
- `README.md`
- `ARCHIVOS_CORREGIDOS.md`

El workflow existente reconstruye automáticamente `public/data` y `docs`; no deben cargarse copias compiladas dentro de este paquete.

Validación final: `npm test && npm run lint && python3 scripts/audit_project.py`.
