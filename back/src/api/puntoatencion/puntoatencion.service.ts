import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrearPuntoAtencionDto } from './dto/crear-puntoatencion.dto';
import { ActualizarPuntoAtencionDto } from './dto/actualizar-puntoatencion.dto';
import { InactivarPuntoDto } from './dto/inactivar-puntoatencion.dto';

@Injectable()
export class PuntoAtencionService {
    private logger = new Logger('PuntoAtencionService');

    constructor(private dataSource: DataSource) {}

    // 📌 Crear un nuevo punto de atención
    async crearPuntoAtencion(dto: CrearPuntoAtencionDto) {
        try {
            const sp = 'CALL sp_puntoatencion_crear(?, ?, ?, ?)';
            const parametros = [dto.nombre, dto.descripcion, dto.ubicacion, dto.activo];
            await this.dataSource.query(sp, parametros);

            return { ok: true, message: 'Punto de atención creado correctamente.' };
        } catch (error) {
            this.logger.error('Error al crear punto de atención', error);
            return { ok: false, message: 'No se pudo crear el punto de atención.' };
        }
    }

    // 📌 Listar puntos de atención
    async listarPuntosAtencion() {
        try {
            const sp = 'CALL sp_puntoatencion_listar()';
            const result = await this.dataSource.query(sp);
            return result[0];
        } catch (error) {
            this.logger.error('Error al listar puntos de atención', error);
            return { ok: false, message: 'No se pudieron listar los puntos de atención.' };
        }
    }

    // 📌 Editar un punto de atención
    async editarPuntoAtencion(dto: ActualizarPuntoAtencionDto) {
        try {
            const sp = 'CALL sp_puntoatencion_editar(?, ?, ?, ?, ?)';
            const parametros = [dto.id, dto.nombre, dto.descripcion, dto.ubicacion, dto.activo];
            await this.dataSource.query(sp, parametros);

            return { ok: true, message: 'Punto de atención actualizado correctamente.' };
        } catch (error) {
            this.logger.error('Error al editar punto de atención', error);
            return { ok: false, message: 'No se pudo actualizar el punto de atención.' };
        }
    }

    // 📌 Inactivar un punto de atención
    async inactivarPuntoAtencion(dto: InactivarPuntoDto) {
        try {
            const sp = 'update puntoatencion set activo=false where id= ?';
            const parametros = [dto.id];
            await this.dataSource.query(sp, parametros);

            return { ok: true, message: 'Punto de atención desactivado correctamente.' };
        } catch (error) {
            this.logger.error('Error al editar punto de atención', error);
            return { ok: false, message: 'No se pudo actualizar el punto de atención.' };
        }
    }


  // CANOSYS: código anterior conservado como referencia; cambiaba el estado sin guardar operador ni historial.
  /*
  async marcarDisponible(id_punto: number, id_usuario?: number) {
    await this.dataSource.query(
      `UPDATE puntoatencion SET disponible = 1, fecha_disponible = NOW() WHERE id = ?`,
      [id_punto],
    );
    return { ok: true };
  }
  */

  // CANOSYS: registra atómicamente un único aviso pendiente por box para alimentar reportes correctos.
  async marcarDisponible(id_punto: number, id_usuario: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CANOSYS: código anterior conservado como referencia; sólo consultaba id y disponible.
      // SELECT id, disponible FROM puntoatencion ...
      // CANOSYS: incluye el nombre y la fecha real para responder correctamente si el box ya está pendiente.
      const puntos = await queryRunner.query(
        `SELECT id, nombre, disponible,
                DATE_FORMAT(fecha_disponible, '%Y-%m-%d %H:%i:%s') AS fecha_disponible,
                DATE_FORMAT(fecha_disponible, '%H:%i:%s') AS hora_disponible
           FROM puntoatencion
          WHERE id = ? AND activo = 1
          FOR UPDATE`,
        [id_punto],
      );

      if (!puntos.length) {
        await queryRunner.rollbackTransaction();
        return { ok: false, message: 'El punto de atención no existe o está inactivo.' };
      }

      if (Number(puntos[0].disponible) === 1) {
        await queryRunner.commitTransaction();
        return {
          ok: true,
          alreadyQueued: true,
          message: 'El box ya se encuentra pendiente en la pantalla pública.',
          // CANOSYS: informa el estado existente sin registrarlo como una llamada nueva.
          result: {
            box: puntos[0].nombre,
            fecha_llamado: puntos[0].fecha_disponible,
            hora: puntos[0].hora_disponible,
          },
        };
      }

      await queryRunner.query(
        `UPDATE puntoatencion
            SET disponible = 1, fecha_disponible = NOW()
          WHERE id = ?`,
        [id_punto],
      );

      // CANOSYS: conserva el resultado de inserción para devolver la hora registrada por MySQL.
      const insertResult = await queryRunner.query(
        `INSERT INTO historial_llamados_box
          (id_puntoatencion, id_usuario, fecha_llamado)
         VALUES (?, ?, NOW())`,
        [id_punto, id_usuario],
      );

      // CANOSYS: devuelve el mismo registro persistido que luego alimentará reportes y recargas.
      const llamadas = await queryRunner.query(
        `SELECT p.nombre AS box,
                DATE_FORMAT(h.fecha_llamado, '%Y-%m-%d %H:%i:%s') AS fecha_llamado,
                DATE_FORMAT(h.fecha_llamado, '%H:%i:%s') AS hora
           FROM historial_llamados_box h
           INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
          WHERE h.id = ?`,
        [insertResult.insertId],
      );

      await queryRunner.commitTransaction();
      return { ok: true, result: llamadas[0] || null };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al registrar el llamado de box libre', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async marcarOcupado(id_punto: number) {
    await this.dataSource.query(
      `UPDATE puntoatencion 
       SET disponible = 0, fecha_disponible = NULL
       WHERE id = ?`,
      [id_punto],
    );
    return { ok: true };
  }

  async listarDisponiblesEnCola() {
    const rows = await this.dataSource.query(
      `SELECT id, nombre, disponible, fecha_disponible
         FROM puntoatencion
        WHERE disponible = 1
        ORDER BY fecha_disponible ASC`,
    );

    return { ok: true, boxes: rows };
  }

  // CANOSYS: consulta la última llamada real del usuario, no la hora temporal del navegador.
  async obtenerUltimaLlamada(id_usuario: number) {
    const rows = await this.dataSource.query(
      `SELECT p.nombre AS box,
              DATE_FORMAT(h.fecha_llamado, '%Y-%m-%d %H:%i:%s') AS fecha_llamado,
              DATE_FORMAT(h.fecha_llamado, '%H:%i:%s') AS hora
         FROM historial_llamados_box h
         INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
        WHERE h.id_usuario = ?
        ORDER BY h.fecha_llamado DESC, h.id DESC
        LIMIT 1`,
      [id_usuario],
    );

    return { ok: true, result: rows[0] || null };
  }


}
