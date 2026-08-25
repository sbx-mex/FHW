# Auditoría ejecutiva FHW · v1.3

## Regla validada

`Cada Taza Cuenta = SUM(FHW) / SUM(Bebidas Lobby)`

El resultado de DM, Región y Nacional es ponderado con sus volúmenes. Nunca se promedian porcentajes de tiendas. La meta se cumple únicamente cuando el resultado es mayor a 10%.

## 10 mejoras verificables

1. Motor ejecutivo Python con resumen semanal precalculado.
2. Control Python de filas inválidas, denominadores, duplicados, anomalías y cobertura.
3. Primera vista compacta con resultado, movimiento, cobertura y semana.
4. Gauge dinámico contra la meta mayor a 10%.
5. Distribución visual: sobre meta, cerca y enfoque.
6. Comparación automática contra el periodo anterior.
7. Navegación Región → DM → Tienda y filtros persistidos en la URL.
8. Exportación rápida a PDF y CSV del alcance activo.
9. Tendencia anual bajo demanda y rankings interactivos Top/Bottom.
10. Carga inicial ligera, PWA, rutas relativas y publicación GitHub Pages.

## Validación

Ejecutar `npm run audit`. El proceso construye datos con Python, prueba la ponderación, valida lint, genera `/docs`, prueba el HTML publicado y emite `public/data/experience-audit.json`.

## Alcance histórico

Semanas 1–29 conservan el porcentaje histórico entregado. Desde semana 30, el cálculo usa FHW y Bebidas Lobby. La vista histórica no inventa ponderaciones cuando la fuente no contiene numeradores y denominadores.
