'use strict';
// Lee la configuración local desde gateway/.env incluso si npm start
// se ejecuta desde otra carpeta. No sobreescribe variables del proceso.
const path = require('node:path');
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.error('[PLC] Error al leer gateway/.env:', envResult.error.message);
  process.exit(1);
}
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { parseButtonEvent } = require('./protocol');

const portName = process.env.PLC_PORT;
const baudRate = Number(process.env.PLC_BAUD_RATE || 115200);
const controllerId = process.env.PLC_CONTROLLER_ID || 'PLC-01';
const apiUrl = (process.env.ENTER_API_URL || 'http://127.0.0.1:5000/api').replace(/\/$/, '');
const apiKey = process.env.ENTER_PLC_KEY;

if (!portName || !apiKey || apiKey.length < 32 || !Number.isInteger(baudRate) || baudRate <= 0 ||
    !/^[A-Za-z0-9_-]{1,32}$/.test(controllerId) || !/^https?:\/\//.test(apiUrl)) {
  console.error('[PLC] Configuración inválida. Revisar PLC_PORT, PLC_BAUD_RATE, PLC_CONTROLLER_ID, ENTER_API_URL y ENTER_PLC_KEY (mínimo 32 caracteres).');
  process.exit(1);
}

console.log(`[PLC] Configuración: puerto ${portName}, velocidad ${baudRate}, controlador ${controllerId}`);
console.log(`[PLC] API: ${apiUrl} (archivo .env: ${envResult.error ? 'no encontrado; variables del proceso' : 'cargado'})`);

function describeNetworkError(error) {
  const parts = [];
  let current = error;
  for (let i = 0; i < 4 && current; i++) {
    parts.push(`${current.code ? current.code + ': ' : ''}${current.message || String(current)}`);
    if (Array.isArray(current.errors)) {
      parts.push(current.errors.map(e => `${e.code || 'ERROR'} ${e.address || ''}:${e.port || ''}`).join(', '));
    }
    current = current.cause;
  }
  return parts.join(' | ');
}

async function checkApi() {
  const url = `${apiUrl}/puntoatencion/disponibles-cola`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    console.log(`[PLC] Diagnóstico API: GET ${url} -> HTTP ${response.status}`);
    if (!response.ok) console.warn('[PLC] Revisar URL, puerto, prefijo /api o estado de NestJS/MySQL.');
  } catch (error) {
    console.error(`[PLC] No se pudo contactar la API ${url}: ${describeNetworkError(error)}`);
    console.error('[PLC] Revisar que NestJS esté ejecutándose y que ENTER_API_URL use el puerto API_PORT correcto.');
  }
}

let port = null;
let reconnectTimer = null;
let stopping = false;
let queue = Promise.resolve();
let pending = 0;
const MAX_PENDING = 100;
const recent = new Map();

async function sendEvent(event) {
  const response = await fetch(`${apiUrl}/hardware/plc/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-enter-plc-key': apiKey },
    body: JSON.stringify({ controllerId, box: event.box, pin: event.pin }),
    signal: AbortSignal.timeout(7000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) {
    throw new Error(`HTTP ${response.status} ${body.message || 'Respuesta no válida'}`);
  }
  if (body.alreadyQueued) {
    console.log(`[PLC] BOX ${event.box}: ya estaba pendiente`);
  } else {
    console.log(`[PLC] BOX ${event.box}: llamado registrado, punto ID ${body.puntoId}`);
  }
}

function enqueue(event) {
  const now = Date.now();
  const previous = recent.get(event.box) || 0;
  if (now - previous < 250) return; // protección adicional, sin bloquear otros BOX
  recent.set(event.box, now);
  if (pending >= MAX_PENDING) {
    console.error('[PLC] Cola local saturada, evento descartado:', event);
    return;
  }
  pending++;
  queue = queue.then(() => sendEvent(event))
    .catch(error => {
      // No se reintenta automáticamente: ante timeout el servidor puede haber registrado el llamado.
      console.error(`[PLC] BOX ${event.box}: no se confirmó el llamado en ${apiUrl}: ${describeNetworkError(error)}`);
    })
    .finally(() => { pending--; });
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 3000);
}

function connect() {
  if (stopping) return;
  const serial = new SerialPort({ path: portName, baudRate, autoOpen: false });
  port = serial;
  const parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', line => {
    const event = parseButtonEvent(line);
    if (event) enqueue(event);
  });
  serial.on('error', error => console.error('[PLC] Error serial:', error.message));
  serial.on('close', () => {
    console.warn('[PLC] USB desconectado; reintentando conexión');
    scheduleReconnect();
  });
  serial.open(error => {
    if (error) {
      console.error('[PLC] No se pudo abrir', portName, error.message);
      scheduleReconnect();
    } else {
      console.log(`[PLC] Conectado a ${portName} (${baudRate} baudios); controlador ${controllerId}`);
    }
  });
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
function stop() {
  if (stopping) return;
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (port && port.isOpen) port.close();
  console.log('[PLC] Deteniendo gateway...');
}
checkApi().catch(error => console.error('[PLC] Diagnóstico API:', describeNetworkError(error)));
connect();
