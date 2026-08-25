# Auditoría ejecutiva FHW · v1.11

## Regla de negocio

`Cada Taza Cuenta = promedio por tienda de (FHW / Bebidas Lobby)`

DM, Región y Nacional muestran el promedio de los porcentajes por tienda. La meta se cumple únicamente cuando el resultado es mayor a 10%.

## Directorio

El motor publica únicamente las 889 tiendas con `Aplica = Sí` del directorio operativo y organiza 11 regiones.

## Mejora de exportación v1.11

1. Navegación compacta `Región | DM | Tienda`.
2. Ranking nacional completo de las 11 regiones; una Región abre sus DMs y un DM abre sus tiendas.
3. Mes y Semana son filtros rápidos visibles, sin ventanas superpuestas; Región y DM mantienen selección simple.
4. Vista principal sin tarjetas técnicas FHW y Bebidas Lobby.
5. Historia breve del corte con movimiento, cobertura y prioridad.
6. Tendencia enero–agosto intercambiable por semanas o meses.
7. Gráficas limpias, interactivas y sin efectos decorativos.
8. Tabla redundante eliminada; Tienda siempre muestra `Nombre · CeCo`.
9. Descarga contextual con confirmación cálida: PDF horizontal directo y Excel XLSX visual; al terminar sólo queda Cerrar.
10. PDF de una hoja sin amontonamientos: periodos amplios se expresan como Inicio–Fin, la gráfica limita sus etiquetas y el listado se distribuye en columnas según el alcance.

## Histórico y ponderación

Semanas 30–34 se calculan con los CSV operativos por tienda: `FHW / Bebidas Lobby`. Semanas 1–29 conservan el porcentaje directo recibido. Todos los alcances muestran el promedio de los porcentajes de sus tiendas; no se suman porcentajes ni se fabrican numeradores o denominadores ausentes.

## Validación

Ejecutar `npm test && npm run lint && python3 scripts/audit_project.py`.
