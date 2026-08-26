# Fuentes de actualización

Consulta primero [ESTADO_DE_CARGA.md](ESTADO_DE_CARGA.md). Conserva estos nombres para actualizar sin tocar código:

- `CTC_FHW.csv`
- `CTC_Bebidas_Lobby.csv`
- `CTC_FHW_1_34.csv`
- `CTC_Bebidas_Lobby_1_34.csv`
- `Directorio_FHW.xlsx`
- `Base_Año_Mes_Sem.xlsx` (opcional)

`*_1_34.csv` es el histórico fijo de 2026, semanas 1–34. Los archivos sin sufijo
son el corte operativo desde la semana 35. El motor lee CSV UTF-16 o UTF-8 y
localiza automáticamente la fila de encabezados.

Al terminar, revisa `public/data/input-status.json`. Si una semana operativa no aparece publicada, descarga `public/data/revision/pending-weeks.json`; no reemplaces el histórico para resolver un corte pendiente.
