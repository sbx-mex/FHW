# Auditoría ejecutiva FHW · v1.5

## Regla de negocio

`Cada Taza Cuenta = SUM(FHW) / SUM(Bebidas Lobby)`

DM, Región y Nacional se calculan con ponderación por volumen. La meta se cumple únicamente cuando el resultado es mayor a 10%.

## Directorio

El motor publica únicamente tiendas aplicables. Si el directorio contiene la columna `Aplica`, exige el valor `Sí`. La versión actual no contiene esa columna y utiliza `Estatus = Abierta` como equivalente operativo; las demás tiendas quedan excluidas.

## Mejora visual v1.5

1. Navegación compacta `Región | DM | Tienda`.
2. Ranking nacional completo de las 11 regiones; una Región abre sus DMs y un DM abre sus tiendas.
3. Selección múltiple únicamente para Mes y Semana.
4. Vista principal sin tarjetas técnicas FHW y Bebidas Lobby.
5. Historia breve del corte con movimiento, cobertura y prioridad.
6. Tendencia intercambiable por semanas o meses.
7. Gráficas limpias, interactivas y sin efectos decorativos.
8. Tabla redundante eliminada; Tienda siempre muestra `Nombre · CeCo`.
9. PDF contextual según la pestaña y alcance activos; CSV eliminado.
10. Toolkit administrado desde `public/data/resources.json`.

## Histórico y ponderación

Semanas 30–34 se calculan con los CSV operativos y permiten ponderación exacta para una o varias semanas: `ΣFHW / ΣBebidas Lobby`. Semanas 1–29 conservan el porcentaje directo recibido; no se fabrica una ponderación cuando faltan numerador y denominador.

## Validación

Ejecutar `npm run audit`. Resultado validado: 33/33 controles, 10/10 mejoras, 14 pruebas Python y 3 pruebas web.
