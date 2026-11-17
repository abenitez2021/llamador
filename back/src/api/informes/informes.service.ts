import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class InformesService {
  logger = new Logger('InformesService');

  constructor(private dataSource: DataSource) { }
  //aprobado
  async informeMovimientos(filtros: any) {
    const { fechaDesde, fechaHasta, idTramite, idBox, idUsuario } = filtros;

    const condiciones = [];
    const params = [];

    if (fechaDesde) {
      condiciones.push("t.fecha_emision >= ?");
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      condiciones.push("t.fecha_emision <= ?");
      params.push(fechaHasta);
    }

    if (idTramite) {
      condiciones.push("t.id_tramite = ?");
      params.push(idTramite);
    }

    if (idBox) {
      condiciones.push("t.box = ?");
      params.push(idBox);
    }

    if (idUsuario) {
      condiciones.push("ht.id_usuario = ?");
      params.push(idUsuario);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const query = `
        SELECT 
        t.codigo_turno, 
        (select concat(nombre, " ", apellido) from visitas v where v.id=t.id_visita) as visitante, 
        (select nro_documento from visitas v where v.id=t.id_visita) as nro_documento,
        t.tramite, 
        (select nombre from puntoatencion p where p.id=t.box) as punto, 
        COALESCE((select concat(nombre, " ", apellido) from usuarios u where u.id= ht.id_usuario ),
        (select concat(nombre, " ", apellido) from usuarios u where u.id= v.id_usuario )) as usuario,
        COALESCE(ht.estado, t.estado) AS estado,
        t.fecha_emision, 
        t.fecha_llamado, 
        t.fecha_finalizacion 
        FROM turnos t 
        LEFT JOIN historial_turnos ht 
        ON ht.id_turno = t.id AND ht.estado = t.estado
        join visitas v on v.id=t.id_visita
        ${whereClause}
        ORDER BY t.fecha_emision DESC;
    `;

    const result = await this.dataSource.query(query, params);
    return { ok: true, result };
  }

  //aprobado
  async graficoTramites(filtros: any) {
    const { fechaDesde, fechaHasta } = filtros;

    const query = `
      SELECT tr.nombre AS tramite, COUNT(*) AS cantidad
      FROM turnos t
      JOIN tramites tr ON tr.id = t.id_tramite
      WHERE t.fecha_emision BETWEEN ? AND ?
      GROUP BY tr.nombre
      ORDER BY cantidad DESC;
    `;

    const result = await this.dataSource.query(query, [fechaDesde, fechaHasta]);
    return { ok: true, result };
  }

  async graficoUsuarios(filtros: any) {
    const { fechaDesde, fechaHasta } = filtros;

    const query = `
      select concat(U.nombre, " ", U.apellido) as USUARIO, COUNT(*) as CANTIDAD 
     from usuarios u join historial_turnos ht on ht.id_usuario = u.id where ht.estado='FINALIZADO'
     and ht.fecha between ? and ?
     group by USUARIO
     order by CANTIDAD
    `;

    const result = await this.dataSource.query(query, [fechaDesde, fechaHasta]);
    return { ok: true, result };
  }
  //aprobado
  async informeTiemposEspera(filtros: any) {
    const { fechaDesde, fechaHasta } = filtros;

    const query = `
       SELECT
        tr.nombre AS tramite,
        p.nombre AS punto,
        u.nombre AS usuario,
        AVG(TIMESTAMPDIFF(MINUTE, t.fecha_emision, t.fecha_llamado)) AS tiempo_promedio,
        MAX(TIMESTAMPDIFF(MINUTE, t.fecha_emision, t.fecha_llamado)) AS tiempo_maximo,
        MIN(TIMESTAMPDIFF(MINUTE, t.fecha_emision, t.fecha_llamado)) AS tiempo_minimo
      FROM turnos t
      JOIN tramites tr ON tr.id = t.id_tramite
      JOIN puntoatencion p ON p.id = t.box
      join visitas v on v.id = t.id_visita 
      JOIN usuarios u ON u.id = v.id_usuario
      WHERE t.fecha_llamado IS NOT NULL
        AND t.fecha_emision BETWEEN ? AND ?
      GROUP BY tr.nombre, p.nombre, u.nombre;
    `;

    const result = await this.dataSource.query(query, [fechaDesde, fechaHasta]);
    return { ok: true, result };
  }


  async getResumenAtencion() {
    const result = await this.dataSource.query(`
      SELECT
  (SELECT COUNT(*) FROM turnos WHERE estado = 'PENDIENTE' AND DATE(fecha_emision) = CURDATE()) AS total_pendientes,
  (SELECT COUNT(*) FROM turnos WHERE estado = 'ATENDIENDO' AND DATE(fecha_emision) = CURDATE()) AS total_atendiendo,
  (SELECT COUNT(*) FROM turnos WHERE estado = 'FINALIZADO' AND DATE(fecha_emision) = CURDATE()) AS total_finalizados,
  (SELECT COUNT(*) FROM turnos WHERE estado = 'CANCELADO' AND DATE(fecha_emision) = CURDATE()) AS total_cancelados,
  (SELECT COUNT(*) FROM turnos WHERE estado = 'REASIGNADO' AND DATE(fecha_emision) = CURDATE()) AS total_reasignados,
  (
    SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, fecha_emision, fecha_llamado)), 1)
    FROM turnos
    WHERE fecha_llamado IS NOT NULL AND DATE(fecha_emision) = CURDATE()
  ) AS promedio_espera_min;
    `);
    return result[0];
  }

  // CANOSYS: reúne en una sola consulta lógica las métricas reales del llamador de box libre.
  async getResumenLlamadosBox() {
    // CANOSYS: ejecuta en paralelo indicadores independientes para agilizar cada actualización del tablero.
    const [resumenRows, pendientesRows, porBox, porOperador, porHora, ultimasLlamadas] = await Promise.all([
      this.dataSource.query(`
        SELECT COUNT(*) AS total_llamados,
               COUNT(DISTINCT h.id_puntoatencion) AS boxes_llamados,
               COUNT(DISTINCT h.id_usuario) AS operadores
          FROM historial_llamados_box h
         WHERE h.fecha_llamado >= CURDATE()
           AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
      `),
      this.dataSource.query(`
        SELECT COUNT(*) AS boxes_en_pantalla
          FROM puntoatencion p
         WHERE p.activo = 1
           AND p.disponible = 1
      `),
      this.dataSource.query(`
        SELECT p.nombre AS nombre, COUNT(*) AS cantidad
          FROM historial_llamados_box h
          INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
         WHERE h.fecha_llamado >= CURDATE()
           AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
         GROUP BY p.id, p.nombre
         ORDER BY cantidad DESC, p.nombre ASC
      `),
      this.dataSource.query(`
        SELECT TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre,
               COUNT(*) AS cantidad
          FROM historial_llamados_box h
          INNER JOIN usuarios u ON u.id = h.id_usuario
         WHERE h.fecha_llamado >= CURDATE()
           AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
         GROUP BY u.id, u.nombre, u.apellido
         ORDER BY cantidad DESC, nombre ASC
      `),
      this.dataSource.query(`
        SELECT DATE_FORMAT(h.fecha_llamado, '%H:00') AS hora,
               COUNT(*) AS cantidad
          FROM historial_llamados_box h
         WHERE h.fecha_llamado >= CURDATE()
           AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
         GROUP BY HOUR(h.fecha_llamado), DATE_FORMAT(h.fecha_llamado, '%H:00')
         ORDER BY HOUR(h.fecha_llamado) ASC
      `),
      this.dataSource.query(`
        SELECT h.id,
               p.nombre AS box,
               TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
               DATE_FORMAT(h.fecha_llamado, '%d/%m/%Y') AS fecha,
               DATE_FORMAT(h.fecha_llamado, '%H:%i:%s') AS hora
          FROM historial_llamados_box h
          INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
          INNER JOIN usuarios u ON u.id = h.id_usuario
         WHERE h.fecha_llamado >= CURDATE()
           AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
         ORDER BY h.fecha_llamado DESC, h.id DESC
         LIMIT 10
      `),
    ]);

    // CANOSYS: normaliza números de MySQL para evitar cadenas en tarjetas y gráficos.
    const resumen = resumenRows[0] || {};
    const boxesEnPantalla = pendientesRows[0] || {};
    const normalizarDistribucion = (rows: any[]) => rows.map((row) => ({
      nombre: row.nombre,
      cantidad: Number(row.cantidad) || 0,
    }));

    // CANOSYS: entrega un contrato único y explícito para el tablero de BOXes.
    return {
      ok: true,
      result: {
        resumen: {
          totalLlamados: Number(resumen.total_llamados) || 0,
          boxesLlamados: Number(resumen.boxes_llamados) || 0,
          operadores: Number(resumen.operadores) || 0,
          boxesEnPantalla: Number(boxesEnPantalla.boxes_en_pantalla) || 0,
        },
        porBox: normalizarDistribucion(porBox),
        porOperador: normalizarDistribucion(porOperador),
        porHora: porHora.map((row) => ({
          hora: row.hora,
          cantidad: Number(row.cantidad) || 0,
        })),
        ultimasLlamadas,
      },
    };
  }

  // CANOSYS: genera el reporte de llamados con límites de fecha inclusivos y filtros parametrizados.
  async getHistorialLlamadosBox(filtros: any) {
    const { fechaDesde, fechaHasta, idPunto, idUsuario } = filtros;
    const condiciones = [
      'h.fecha_llamado >= ?',
      'h.fecha_llamado < DATE_ADD(?, INTERVAL 1 DAY)',
    ];
    const parametros: any[] = [fechaDesde, fechaHasta];

    // CANOSYS: agrega sólo los filtros seleccionados sin concatenar valores en SQL.
    if (idPunto) {
      condiciones.push('h.id_puntoatencion = ?');
      parametros.push(Number(idPunto));
    }
    if (idUsuario) {
      condiciones.push('h.id_usuario = ?');
      parametros.push(Number(idUsuario));
    }

    // CANOSYS: consulta el detalle y las opciones desde el mismo historial real del llamador.
    const [result, boxes, operadores] = await Promise.all([
      this.dataSource.query(`
        SELECT h.id,
               p.id AS idPunto,
               p.nombre AS box,
               u.id AS idUsuario,
               TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
               DATE_FORMAT(h.fecha_llamado, '%d/%m/%Y') AS fecha,
               DATE_FORMAT(h.fecha_llamado, '%H:%i:%s') AS hora,
               DATE_FORMAT(h.fecha_llamado, '%Y-%m-%d %H:%i:%s') AS fechaHora
          FROM historial_llamados_box h
          INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
          INNER JOIN usuarios u ON u.id = h.id_usuario
         WHERE ${condiciones.join(' AND ')}
         ORDER BY h.fecha_llamado DESC, h.id DESC
      `, parametros),
      this.dataSource.query(`
        SELECT DISTINCT p.id, p.nombre
          FROM historial_llamados_box h
          INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
         ORDER BY p.nombre ASC
      `),
      this.dataSource.query(`
        SELECT DISTINCT u.id, TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre
          FROM historial_llamados_box h
          INNER JOIN usuarios u ON u.id = h.id_usuario
         ORDER BY nombre ASC
      `),
    ]);

    // CANOSYS: devuelve datos y catálogos verificados en un único contrato para mantener filtros estables.
    return { ok: true, result, filtros: { boxes, operadores } };
  }

}
