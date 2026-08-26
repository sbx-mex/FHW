# Reparación inmediata · pantalla blanca

## Causa corregida

El navegador intentaba cargar un CSS diferido del dashboard. Cuando ese archivo
no quedaba disponible al mismo tiempo que el HTML publicado, React detenía el
inicio y GitHub Pages mostraba una pantalla blanca. Además, el service worker
conservaba recursos de versiones anteriores.

## Cambios incluidos

1. El CSS de estado se integra a la hoja principal; el tablero no depende de
   un CSS diferido adicional al iniciar.
2. Se elimina `app/input-status.css`, que quedó obsoleto tras la integración.
3. Se generan nuevos archivos de `docs/assets` coherentes entre sí.
4. Se elimina el GIF obsoleto de la publicación generada; se conserva el video
   `fhw-revision.mp4`.
5. Se desactiva la interceptación y el precargado persistente del service
   worker. El archivo `sw.js` sólo limpia los cachés antiguos `fhw-*`.
6. El dashboard ya no registra un service worker nuevo.
7. El workflow deja de ejecutar la limpieza del GIF que ya no existe.

## Cómo aplicar

1. Descomprime este paquete.
2. Sube y confirma todas las carpetas y archivos conservando su estructura:
   `app/`, `public/`, `docs/`, `.github/` y los archivos raíz.
3. Espera que terminen **Validar FHW**, **Publicar FHW limpio** y
   **pages build and deployment**.
4. Abre `https://sbx-mex.github.io/FHW/` en una pestaña nueva. Si ese navegador
   ya había abierto una versión anterior, usa `Ctrl + F5` una única vez.

## Verificación realizada

- `npm run build`
- Generación de GitHub Pages desde `docs/`
- Pruebas de HTML renderizado: 3/3
- Auditoría de proyecto: 40/40 y 10/10 mejoras
