# Aplicar las 10 mejoras FHW

1. Sube este paquete manteniendo sus carpetas y nombres.
2. En GitHub, abre **Actions** → **Publicar FHW limpio** → **Run workflow**.
3. Confirma que la auditoría termine en verde.
4. Abre **Actions** → **Retirar motor histórico anterior** → **Run workflow**.
5. Verifica que `input/FHW_Sem1_29.csv` desapareció.

## Qué agrega

- Estado visible de actualización en el dashboard.
- Descarga de fuentes usadas y archivo de cruces pendientes.
- `input-status.json` y revisión de CeCos pendientes.
- Guía de carga con periodos y acciones permitidas.
- Pruebas para impedir que se pierda la trazabilidad.
- Corrección del workflow que impedía eliminar el archivo obsoleto.

La semana operativa sólo se publica con 90% o más de coincidencia entre FHW y
Bebidas Lobby. Si queda pendiente, el tablero conserva el último corte seguro y
explica la causa sin ocultar información.
