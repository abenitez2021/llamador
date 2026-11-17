// CANOSYS: valida las consultas del panel sin exponer credenciales ni datos personales.
require('dotenv').config();
const mysql = require('mysql');

// CANOSYS: reutiliza la configuración de la aplicación para consultar la base de prueba activa.
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// CANOSYS: replica cada forma de consulta usada por el endpoint del tablero.
const queries = [
  `SELECT COUNT(*) AS total_llamados,
          COUNT(DISTINCT h.id_puntoatencion) AS boxes_llamados,
          COUNT(DISTINCT h.id_usuario) AS operadores
     FROM historial_llamados_box h
    WHERE h.fecha_llamado >= CURDATE()
      AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY`,
  `SELECT COUNT(*) AS boxes_en_pantalla
     FROM puntoatencion p
    WHERE p.activo = 1 AND p.disponible = 1`,
  `SELECT p.nombre AS nombre, COUNT(*) AS cantidad
     FROM historial_llamados_box h
     INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
    WHERE h.fecha_llamado >= CURDATE()
      AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
    GROUP BY p.id, p.nombre
    ORDER BY cantidad DESC, p.nombre ASC`,
  `SELECT TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS nombre, COUNT(*) AS cantidad
     FROM historial_llamados_box h
     INNER JOIN usuarios u ON u.id = h.id_usuario
    WHERE h.fecha_llamado >= CURDATE()
      AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
    GROUP BY u.id, u.nombre, u.apellido
    ORDER BY cantidad DESC, nombre ASC`,
  `SELECT DATE_FORMAT(h.fecha_llamado, '%H:00') AS hora, COUNT(*) AS cantidad
     FROM historial_llamados_box h
    WHERE h.fecha_llamado >= CURDATE()
      AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
    GROUP BY HOUR(h.fecha_llamado), DATE_FORMAT(h.fecha_llamado, '%H:00')
    ORDER BY HOUR(h.fecha_llamado) ASC`,
  `SELECT h.id, p.nombre AS box,
          TRIM(CONCAT_WS(' ', u.nombre, u.apellido)) AS operador,
          DATE_FORMAT(h.fecha_llamado, '%d/%m/%Y') AS fecha,
          DATE_FORMAT(h.fecha_llamado, '%H:%i:%s') AS hora
     FROM historial_llamados_box h
     INNER JOIN puntoatencion p ON p.id = h.id_puntoatencion
     INNER JOIN usuarios u ON u.id = h.id_usuario
    WHERE h.fecha_llamado >= CURDATE()
      AND h.fecha_llamado < CURDATE() + INTERVAL 1 DAY
    ORDER BY h.fecha_llamado DESC, h.id DESC
    LIMIT 10`,
];

// CANOSYS: informa sólo estructura y cantidad de filas para proteger la información de usuarios.
connection.connect((connectionError) => {
  if (connectionError) {
    console.error('DB_CONNECT_ERROR');
    process.exit(1);
  }

  let pending = queries.length;
  const checks = [];
  queries.forEach((query, index) => {
    connection.query(query, (queryError, rows) => {
      checks[index] = queryError
        ? { ok: false, error: queryError.code }
        : { ok: true, rows: rows.length, fields: rows.length ? Object.keys(rows[0]) : [] };

      if (--pending === 0) {
        console.log(JSON.stringify(checks));
        connection.end();
        if (checks.some((check) => !check.ok)) process.exitCode = 1;
      }
    });
  });
});
