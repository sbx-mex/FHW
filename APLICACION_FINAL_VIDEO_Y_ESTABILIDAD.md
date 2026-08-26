# Aplicación final · Video y estabilidad FHW

## Contenido

- Sustituye el GIF por `public/assets/fhw-revision.mp4`.
- Reproducción segura: sin sonido, en bucle, dentro de la página y con controles.
- Conserva las mejoras de fuentes, revisión de cruces y estado de actualización.
- Corrige la publicación automática cuando coincide con una carga manual.
- Elimina `fhw-nitido.gif` durante la siguiente publicación válida.

## Aplicación

1. Sube el contenido manteniendo las rutas del paquete.
2. Espera a terminar todas las cargas manuales.
3. Ejecuta **Actions → Publicar FHW limpio → Run workflow**.
4. Confirma que termine en verde; ese flujo genera los JSON, publica el video y retira el GIF anterior.
5. Ejecuta después **Retirar motor histórico anterior** para borrar `FHW_Sem1_29.csv`.

No borres el video ni los CSV históricos. Si S35 aparece como pendiente, descarga el archivo de revisión desde el tablero y actualiza únicamente el CSV operativo que falte.
