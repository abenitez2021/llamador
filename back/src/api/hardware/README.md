# ENTER PLC – integración física

Este controlador recibe `BTN;N;D3X` del firmware (7 botones instalados, capacidad 8) mediante el servicio separado `gateway/` de la NUC. No crear solicitudes de llamado a partir de mensajes `STATE`, `OUT` ni `READY`.

## Configurar backend NestJS (`back/.env`, no subir al repositorio)

```dotenv
ENTER_PLC_KEY=GENERAR_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
PLC_CONTROLLER_ID=PLC-01
PLC_USUARIO_ID=ID_REAL_DE_USUARIO_TECNICO_ACTIVO_CON_ROL_1_O_5
PLC_BOX_MAP=1:63,2:64,3:65
```

Los IDs del ejemplo se encontraron en el dump histórico y **no se deben asumir vigentes**. Ejecutar:

```sql
SELECT id, nombre, activo FROM puntoatencion ORDER BY id;
SELECT id, nombre, apellido, id_rol, estado FROM usuarios WHERE id = ID_USUARIO_TECNICO;
```

Establecer un mapeo **explícito** para cada botón instalado (1–7). La API devuelve un error si llega un botón no configurado. No publica un endpoint sin clave ni permite que el Gateway elija el ID SQL.

## Configurar gateway en NUC (Windows / Node.js 18+)

Cerrar el monitor serie Arduino. Desde `gateway/`:

```powershell
npm install
npm test
$env:PLC_PORT = "COM4"
$env:PLC_BAUD_RATE = "115200"
$env:PLC_CONTROLLER_ID = "PLC-01"
$env:ENTER_API_URL = "http://127.0.0.1:5000/api"
$env:ENTER_PLC_KEY = "MISMO_SECRETO_LARGO_CONFIGURADO_EN_BACKEND"
npm start
```

Cambiar puerto y URL a los reales. El servicio NO carga `.env` automáticamente: configurar variables del proceso o un lanzador de Windows protegido. El backend debe estar iniciado antes de probar.

Al pulsar el BOX 3 debe aparecer `BOX 3: llamado registrado`; `GET /api/puntoatencion/disponibles-cola` permite a la pantalla `/public-cola-simple` anunciarlo.

## Seguridad y comportamiento

- Los `BTN` se procesan en el orden de llegada por un único gateway; `OUT` y `STATE` se ignoran.
- El evento no se reintenta automáticamente si el servidor no responde: un timeout puede producirse tras registrar la llamada, por lo que retransmitirla sin ID único sería ambiguo.
- Si el backend retorna `alreadyQueued`, no se inserta nuevamente.
- El firmware enciende su luz durante 5 s *independientemente* del éxito del HTTP. En una futura versión puede añadirse ACK serial para sincronizarla.
- La pantalla pública consulta cada 3 s. Mantener una sola instancia de pantalla pública para prevenir cierres concurrentes.
- La clave es un secreto técnico, no se debe colocar en JavaScript del navegador ni subir a GitHub.
- Configurar el gateway como servicio de Windows **solo después de las pruebas**; en esta fase se ejecuta manualmente.
