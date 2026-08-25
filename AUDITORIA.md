# Auditoría ejecutiva FHW · v1.4

## Regla de negocio

`Cada Taza Cuenta = SUM(FHW) / SUM(Bebidas Lobby)`

DM, Región y Nacional se calculan con ponderación por volumen. La meta se cumple únicamente cuando el resultado es mayor a 10%.

## Directorio

El motor publica únicamente tiendas aplicables. Si el directorio contiene la columna `Aplica`, exige el valor `Sí`. La versión actual no contiene esa columna y utiliza `Estatus = Abierta` como equivalente operativo; las demás tiendas quedan excluidas.

## Mejora visual v1.4

1. Navegación jerárquica Región → DM → Tienda.
2. Ranking nacional de regiones, regional de DMs y distrital de tiendas.
3. Selección múltiple con casillas para Región y DM.
4. Vista principal sin tarjetas técnicas FHW y Bebidas Lobby.
5. Historia breve del corte con movimiento, cobertura y prioridad.
6. Tendencia intercambiable por semanas o meses.
7. Gráficas limpias, interactivas y sin efectos decorativos.
8. Tabla reducida a Nombre, Cada Taza Cuenta y Estado.
9. PDF contextual según la pestaña y alcance activos; CSV eliminado.
10. Toolkit administrado desde `public/data/resources.json`.

## Validación

Ejecutar `npm run audit`. El proceso construye con Python, prueba la ponderación y elegibilidad, valida el sitio y regenera `/docs` para GitHub Pages.
