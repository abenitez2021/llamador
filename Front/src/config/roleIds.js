// CANOSYS: replica las claves estables de ENTER_TURNERO para autorizar por ID y no por nombre visible.
export const ROLE_IDS = Object.freeze({
  ADMINISTRADOR: 1,
  GUARDIA: 2,
  TURNERO: 3,
  PANTALLA: 4,
  LLAMADOR: 5,
  SUPERVISOR: 6,
});

// CANOSYS: normaliza valores numéricos o textuales recibidos desde autenticación.
export const hasRoleId = (idRol, ...allowedRoleIds) =>
  allowedRoleIds.includes(Number(idRol));

// CANOSYS: centraliza el acceso directo a vistas autenticadas para evitar permisos basados en etiquetas.
const ROUTE_ROLE_IDS = Object.freeze({
  "/": Object.values(ROLE_IDS),
  "/atencion": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  // CANOSYS: autoriza el panel operativo por rol y no por nombre de usuario.
  "/tablero-llamados-box": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  // CANOSYS: restringe el reporte de llamados a Administración y Supervisión.
  "/resumen/llamados-box": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  "/gestion/lista-personas-visitantes": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/lista-usuarios-guardias": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/lista-dependencias": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/alta-tramite": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/lista-tramites": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/alta-puntoatencion": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/lista-puntoatencion": [ROLE_IDS.ADMINISTRADOR],
  // CANOSYS: restringe la configuración de duración y video exclusivamente a Administración.
  "/gestion/configuracion-pantalla-publica": [ROLE_IDS.ADMINISTRADOR],
  "/gestion/alta-dependencia": [ROLE_IDS.ADMINISTRADOR],
  "/movimientos/lista-movimientos": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA],
  "/movimientos/lista-movimientos-dos": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA],
  "/movimientos/turnero": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.TURNERO],
  "/movimientos/llamador": [ROLE_IDS.ADMINISTRADOR],
  "/movimientos/llamador-cola-simple": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.LLAMADOR],
  "/movimientos/contraseña": Object.values(ROLE_IDS),
  "/movimientos/errores": [ROLE_IDS.ADMINISTRADOR],
  "/movimientos/lista-movimientos-usuarios": [ROLE_IDS.ADMINISTRADOR],
  "/resumen/entradas": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA],
  "/resumen/salidas": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA],
  "/resumen/permanencia": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA],
  "/resumen/informe-movimientos": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  "/resumen/grafico-usuarios": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  "/resumen/grafico-tramites": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
  "/resumen/tiempos-espera": [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR],
});

// CANOSYS: deniega rutas autenticadas no declaradas en lugar de conceder acceso accidentalmente.
export const canAccessRoute = (path, idRol) =>
  hasRoleId(idRol, ...(ROUTE_ROLE_IDS[path] || []));
