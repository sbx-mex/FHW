# Auditoría ejecutiva FHW · v1.7

## Regla de negocio

`Cada Taza Cuenta = promedio por tienda de (FHW / Bebidas Lobby)`

DM, Región y Nacional se calculan con ponderación por volumen. La meta se cumple únicamente cuando el resultado es mayor a 10%.

## Directorio

El motor publica únicamente las 889 tiendas con `Aplica = Sí` del directorio operativo y organiza 11 regiones.

## Mejora visual v1.7

1. Navegación compacta `Región | DM | Tienda`.
2. Ranking nacional completo de las 11 regiones; una Región abre sus DMs y un DM abre sus tiendas.
3. Mes y Semana son filtros rápidos visibles, sin ventanas superpuestas; Región y DM mantienen selección simple.
4. Vista principal sin tarjetas técnicas FHW y Bebidas Lobby.
5. Historia breve del corte con movimiento, cobertura y prioridad.
6. Tendencia enero–agosto intercambiable por semanas o meses.
7. Gráficas limpias, interactivas y sin efectos decorativos.
8. Tabla redundante eliminada; Tienda siempre muestra `Nombre · CeCo`.
9. Descarga contextual reubicada junto a filtros: PDF ejecutivo y Excel XLSX visual; CSV eliminado.
10. Toolkit administrado desde `public/data/resources.json`.

## Histórico y ponderación

Semanas 30–34 se calculan con los CSV operativos y permiten ponderación exacta para una o varias semanas: `ΣFHW / ΣBebidas Lobby`. Semanas 1–29 conservan el porcentaje directo recibido. Para contar una historia comparable enero–agosto, el histórico muestra la proporción real de tiendas por encima de 10%; no se fabrican numeradores ni denominadores ausentes.

## Validación

Ejecutar `npm run audit`. Resultado validado: 33/33 controles, 10/10 mejoras, 15 pruebas Python, 3 pruebas web y apertura comprobada del XLSX con `openpyxl`.
