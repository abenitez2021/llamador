import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, resolve } from 'path';

// CANOSYS: centraliza la carpeta persistente del contenido cargado desde Administración.
export function obtenerRutaMediosPantalla(): string {
  return resolve(
    process.env.MEDIA_PATH || resolve(process.cwd(), '..', 'data', 'pantalla-publica'),
  );
}

// CANOSYS: admite solamente formatos que los navegadores de la Pantalla Pública pueden reproducir.
const tiposVideoPermitidos = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

// CANOSYS: guarda primero con nombre temporal para no reemplazar el video activo si la carga falla.
export const VideoPantallaStorage = diskStorage({
  destination: (_request, _file, callback) => {
    const rutaMedios = obtenerRutaMediosPantalla();
    if (!existsSync(rutaMedios)) {
      mkdirSync(rutaMedios, { recursive: true });
    }
    callback(null, rutaMedios);
  },
  filename: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    callback(null, `carga-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

// CANOSYS: rechaza archivos no reproducibles antes de escribirlos en el servidor.
export function filtrarVideoPantalla(_request: unknown, file: any, callback: any) {
  if (!tiposVideoPermitidos.has(file.mimetype)) {
    return callback(
      new BadRequestException('El video debe estar en formato MP4, WebM u Ogg.'),
      false,
    );
  }
  return callback(null, true);
}
