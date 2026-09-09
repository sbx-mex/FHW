# Segmentadores conectados — FHW Power BI

## Principio

El visual **HTML Content (lite)** no puede crear ni hospedar los segmentadores de Power BI; es una restricción de seguridad del visual. El HTML sí responde automáticamente a todos los filtros de la página.

Por ello, se crean una sola vez como visuales nativos y se sincronizan. El resultado es una sola página operativa con la tarjeta HTML completa debajo.

## Configuración única

En la página **Tienda** inserta cuatro segmentadores de datos, en este orden:

1. `FHW_Modelo[Región]`
2. `FHW_Modelo[DM]`
3. `FHW_Modelo[Tienda]`
4. `FHW_Modelo[SemanaID]`

Configura cada uno como **desplegable** y activa búsqueda en Tienda. En SemanaID activa selección única cuando se vaya a usar la comparación semanal.

Después abre **Ver > Sincronizar segmentadores**:

- Región: sincronizar Región, DM y Tienda.
- DM: sincronizar DM y Tienda.
- SemanaID: sincronizar Región, DM y Tienda.
- Tienda: visible y sincronizado sólo en Tienda.

El HTML completo reacciona a las selecciones sin añadir nada a *Granularity* ni a *Tooltips*.

## Medida a usar

1. Crea la medida de `HTML_Tienda_Completo.dax`.
2. Inserta **HTML Content (lite)**.
3. Arrastra `HTML Tienda - Completo` a **Values**.
4. Ajusta el visual a todo el ancho debajo de la fila de segmentadores.

## Prueba

Selecciona una Tienda y la semana `202630`. Para CeCo 38101 la tarjeta debe reflejar 59 FHW, 3,111 Bebidas Lobby y un CTC cercano a 1.9%.
