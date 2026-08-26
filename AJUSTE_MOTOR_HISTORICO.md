# Paquete de corrección · Motor FHW

## Aplicación

1. Sube y reemplaza los archivos de este paquete respetando sus rutas.
2. Elimina `input/FHW_Sem1_29.csv`; ya no forma parte del motor.
3. Conserva `input/CTC_FHW.csv` como fuente desde la semana 35. Al actualizarlo,
   incluye sólo semanas 35 o posteriores.
4. Ejecuta el workflow **Publicar FHW limpio**. El workflow de retiro es manual y
   sólo debe ejecutarse después de que la publicación y las pruebas terminen bien.

## Regla de publicación

El histórico usa ambos CSV de semanas 1–34. La operación usa ambos CSV de semana
35 en adelante. Cada semana operativa se publica únicamente con al menos 90% de
coincidencia entre CeCos de FHW y Bebidas Lobby.
