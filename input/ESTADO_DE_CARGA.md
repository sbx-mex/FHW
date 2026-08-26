# Carga FHW · guía rápida

| Motor | Archivo | Semanas permitidas | Acción |
| --- | --- | --- | --- |
| Histórico | `CTC_FHW_1_34.csv` | 1–34 de 2026 | Sólo reemplazar al corregir histórico. |
| Histórico | `CTC_Bebidas_Lobby_1_34.csv` | 1–34 de 2026 | Sólo reemplazar al corregir histórico. |
| Operativo | `CTC_FHW.csv` | 35 en adelante | Reemplazar en cada corte semanal. |
| Operativo | `CTC_Bebidas_Lobby.csv` | 35 en adelante | Reemplazar en cada corte semanal. |
| Referencia | `Directorio_FHW.xlsx` | Vigente | Actualizar sólo cambios de tienda, Región, DM o Aplica. |
| Calendario | `Base_Año_Mes_Sem.xlsx` | Opcional | Actualizar al cambiar la relación Mes–Semana. |

## Antes de publicar

1. Conserva exactamente los nombres de archivo.
2. Confirma que FHW y Lobby contengan la misma semana operativa.
3. Consulta `public/data/input-status.json`.
4. Si una semana queda pendiente, descarga `public/data/revision/pending-weeks.json`.
5. No subas ni recuperes `FHW_Sem1_29.csv`: quedó obsoleto.
