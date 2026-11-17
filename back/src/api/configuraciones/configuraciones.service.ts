import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, renameSync, unlinkSync } from 'fs';
import { basename, resolve } from 'path';
import { DataSource } from 'typeorm';
import { ActualizarPantallaPublicaDto } from './dto/actualizar-pantalla-publica.dto';
import { obtenerRutaMediosPantalla } from './video-pantalla.storage';

@Injectable()
export class ConfiguracionesService {
    // CANOSYS: valores seguros utilizados mientras una instalación anterior aún no tenga configuración persistida.
    private readonly configuracionPredeterminada = {
        duracionBoxSegundos: 5,
        videoUrl: '/video.mp4',
        videoNombre: 'video.mp4',
        actualizadoEn: null,
    };
    private readonly logger = new Logger('ConfiguracionesService');

    // CANOSYS: incorpora acceso directo a la configuración operativa almacenada en MySQL.
    constructor(private readonly dataSource: DataSource) {}

    // CANOSYS: expone únicamente datos públicos necesarios para sincronizar llamador y Pantalla Pública.
    async obtenerPantallaPublica() {
        try {
            const rows = await this.dataSource.query(
                `SELECT duracion_box_segundos AS duracionBoxSegundos,
                        video_archivo AS videoArchivo,
                        video_nombre_original AS videoNombre,
                        UNIX_TIMESTAMP(actualizado_en) AS versionVideo,
                        DATE_FORMAT(actualizado_en, '%Y-%m-%d %H:%i:%s') AS actualizadoEn
                   FROM configuracion_pantalla_publica
                  WHERE id = 1
                  LIMIT 1`,
            );
            const row = rows[0];
            if (!row) return this.configuracionPredeterminada;

            // CANOSYS: fuerza rangos válidos aunque la base haya sido editada manualmente.
            const duracionBoxSegundos = Math.min(120, Math.max(1, Number(row.duracionBoxSegundos) || 5));
            // CANOSYS: usa el video empaquetado si una base restaurada referencia un archivo que ya no existe.
            const rutaVideoConfigurado = row.videoArchivo
                ? resolve(obtenerRutaMediosPantalla(), basename(row.videoArchivo))
                : '';
            const videoDisponible = Boolean(rutaVideoConfigurado && existsSync(rutaVideoConfigurado));
            const videoUrl = videoDisponible
                ? `/api/configuraciones/pantalla-publica/video?v=${row.versionVideo || Date.now()}`
                : '/video.mp4';
            return {
                duracionBoxSegundos,
                videoUrl,
                videoNombre: videoDisponible ? (row.videoNombre || 'video configurado') : 'video.mp4',
                actualizadoEn: row.actualizadoEn || null,
            };
        } catch (error) {
            // CANOSYS: mantiene operativa la pantalla con los valores históricos si falta la migración.
            this.logger.warn(`No se pudo leer la configuración de Pantalla Pública: ${error.message}`);
            return this.configuracionPredeterminada;
        }
    }

    // CANOSYS: persiste la duración elegida por Administración sin modificar el video vigente.
    async actualizarPantallaPublica(dto: ActualizarPantallaPublicaDto, idUsuario: number) {
        await this.dataSource.query(
            `INSERT INTO configuracion_pantalla_publica
                (id, duracion_box_segundos, actualizado_por)
             VALUES (1, ?, ?)
             ON DUPLICATE KEY UPDATE
                duracion_box_segundos = VALUES(duracion_box_segundos),
                actualizado_por = VALUES(actualizado_por),
                actualizado_en = CURRENT_TIMESTAMP`,
            [dto.duracionBoxSegundos, idUsuario],
        );
        return { ok: true, configuracion: await this.obtenerPantallaPublica() };
    }

    // CANOSYS: activa una carga completa sólo después de almacenarla y actualizar MySQL correctamente.
    async actualizarVideoPantalla(file: any, idUsuario: number) {
        // CANOSYS: informa como solicitud inválida la ausencia del archivo obligatorio.
        if (!file) throw new BadRequestException('Debe seleccionar un archivo de video.');

        const extensionesPorMime = {
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/ogg': '.ogv',
        };
        const extension = extensionesPorMime[file.mimetype];
        const rutaMedios = obtenerRutaMediosPantalla();
        const nombreFinal = `video-publico-${Date.now()}${extension}`;
        const rutaFinal = resolve(rutaMedios, nombreFinal);
        const configuracionAnterior: any[] = await this.dataSource.query(
            'SELECT video_archivo AS videoArchivo FROM configuracion_pantalla_publica WHERE id = 1 LIMIT 1',
        );

        try {
            renameSync(file.path, rutaFinal);
            await this.dataSource.query(
                `INSERT INTO configuracion_pantalla_publica
                    (id, video_archivo, video_nombre_original, video_mime, actualizado_por)
                 VALUES (1, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    video_archivo = VALUES(video_archivo),
                    video_nombre_original = VALUES(video_nombre_original),
                    video_mime = VALUES(video_mime),
                    actualizado_por = VALUES(actualizado_por),
                    actualizado_en = CURRENT_TIMESTAMP`,
                [nombreFinal, basename(file.originalname), file.mimetype, idUsuario],
            );
        } catch (error) {
            // CANOSYS: elimina únicamente la carga incompleta y conserva el video anterior activo.
            if (existsSync(file.path)) unlinkSync(file.path);
            if (existsSync(rutaFinal)) unlinkSync(rutaFinal);
            throw error;
        }

        // CANOSYS: retira el archivo reemplazado después de confirmar el nuevo registro.
        const nombreAnterior = configuracionAnterior[0]?.videoArchivo;
        if (nombreAnterior && nombreAnterior !== nombreFinal) {
            const rutaAnterior = resolve(rutaMedios, basename(nombreAnterior));
            // CANOSYS: una falla de limpieza no revierte el video nuevo que ya quedó activo correctamente.
            try {
                if (existsSync(rutaAnterior)) unlinkSync(rutaAnterior);
            } catch (error) {
                this.logger.warn(`No se pudo retirar el video anterior ${rutaAnterior}: ${error.message}`);
            }
        }
        return { ok: true, configuracion: await this.obtenerPantallaPublica() };
    }

    // CANOSYS: resuelve el archivo configurado dentro de la carpeta autorizada para su descarga pública.
    async obtenerVideoPantalla() {
        const rows = await this.dataSource.query(
            `SELECT video_archivo AS videoArchivo, video_mime AS videoMime
               FROM configuracion_pantalla_publica WHERE id = 1 LIMIT 1`,
        );
        const nombre = rows[0]?.videoArchivo ? basename(rows[0].videoArchivo) : '';
        const ruta = nombre ? resolve(obtenerRutaMediosPantalla(), nombre) : '';
        if (!ruta || !existsSync(ruta)) {
            throw new NotFoundException('No se encontró el video configurado.');
        }
        return { ruta, mime: rows[0].videoMime || 'application/octet-stream' };
    }

}
