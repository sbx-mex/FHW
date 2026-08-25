# FHW v1.11 · Archivos para reemplazar

Reemplaza únicamente estos archivos conservando sus rutas:

- `app/dashboard.tsx`
- `app/pdf-report.ts`
- `app/premium.css`
- `scripts/audit_project.py`
- `package.json`
- `package-lock.json`
- `public/sw.js`
- `public/assets/fhw-nitido.gif`
- `AUDITORIA.md`
- `README.md`
- `ARCHIVOS_CORREGIDOS.md`

El workflow existente reconstruye automáticamente `public/data` y `docs`; no deben cargarse copias compiladas dentro de este paquete. Esta versión resume periodos amplios como Inicio–Fin, evita etiquetas superpuestas en el PDF y agrega el GIF de revisión dentro del tablero.

Validación final: `npm test && npm run lint && python3 scripts/audit_project.py`.
