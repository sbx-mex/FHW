# Archivos corregidos · FHW v1.3

Reemplaza estos archivos conservando la misma ruta:

- `app/dashboard.tsx`
- `app/globals.css`
- `scripts/build_data.py`
- `scripts/audit_project.py`
- `tests/test_pipeline.py`
- `tests/rendered-html.test.mjs`
- `package.json`
- `package-lock.json`
- `AUDITORIA.md`
- `public/data/fhw-dashboard.json`
- `public/data/data-audit.json`
- `public/data/experience-audit.json`

Para GitHub Pages, elimina primero la carpeta `docs` anterior y carga la carpeta `docs` incluida. Esto evita conservar paquetes JavaScript obsoletos con nombres hash.

Validación final: `npm run audit`.
