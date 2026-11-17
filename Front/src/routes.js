// routes.js
import React from "react";
import { Redirect } from "react-router-dom";
import NotFound from "./components/NotFound";
import Login from "./page/Login";
import Tablero from "./page/Tablero";
import NuevaDependencia from "./page/gestion/NuevaDependencia";
import ListaEntradasDia from "./page/servicios/ListaEntradasDia";
import ListaAccesoVisitantes from "./page/movimientos/ListaAccesoVisitantes";
import ListaAccesoUsuarios from "./page/movimientos/ListaAccesoUsuarios";
import ListasSalidasDia from "./page/servicios/ListasSalidasDia";
import ListaPermanenciaDia from "./page/servicios/ListaPermanenciaDia";
import ListaPersonasVisitantes from "./page/gestion/ListaPersonasVisitantes";
import ListaUsuarioGuardias from "./page/gestion/ListaUsuarioGuardias";
import ListaDependencia from "./page/gestion/ListaDependencia";
import ListaAccesoVisitantesDos from "./page/movimientos/ListaAccesoVisitantesDos";
import Contraseña from "./page/movimientos/Contraseña";
import ListaTramites from "./page/gestion/ListaTramites";
import NuevoTramite from "./page/gestion/NuevoTramite";
import Turnero from "./page/movimientos/Turnero";
import ListaPuntos from "./page/gestion/ListaPuntos";
// CANOSYS: incorpora la configuración administrativa de la Pantalla Pública.
import ConfiguracionPantallaPublica from "./page/gestion/ConfiguracionPantallaPublica";
import NuevoPunto from "./page/gestion/NuevoPunto";
import LlamadorTurnos from "./page/movimientos/LlamadorTurnos";
import PublicTurnos from "./page/PublicTurnos";
import TableroAtencion from "./page/TableroAtencion";
// CANOSYS: incorpora el tablero específico del flujo de BOX libre.
import TableroLlamadosBox from "./page/TableroLlamadosBox";
// CANOSYS: incorpora el informe histórico específico de llamados de BOX libre.
import InformeLlamadosBox from "./page/servicios/InformeLlamadosBox";
import InformeMovimientos from "./page/servicios/InformeMovimientos";
import InformeGraficoUsuarios from "./page/servicios/InformeGraficoUsuarios";
import InformeGraficoTramites from "./page/servicios/InformeGraficoTramites";
import InformeTiemposEspera from "./page/servicios/InformeTiemposEspera";
import ErroresLectura from "./page/movimientos/ErroresLectura";
import LlamadorColaSimple from "./page/movimientos/LlamadorColaSimple";
import PublicColaSimple from "./page/PublicColaSimple";
import { getUserPrincipal } from "./utils/user/UserService";
import { ROLE_IDS } from "./config/roleIds";

// CANOSYS: dirige el inicio del rol LLAMADOR a la operación confirmada de box libre.
const InicioPorRol = () => {
  const principal = getUserPrincipal();
  // CANOSYS: código anterior conservado como referencia.
  // return Number(principal?.idRol) === ROLE_IDS.LLAMADOR
  //   ? <Redirect to="/movimientos/llamador-cola-simple" />
  //   : <Tablero />;
  // CANOSYS: dirige cada rol vigente al módulo propio de ENTER_LLAMADOR.
  const idRol = Number(principal?.idRol);
  if (idRol === ROLE_IDS.LLAMADOR) {
    return <Redirect to="/movimientos/llamador-cola-simple" />;
  }
  if (idRol === ROLE_IDS.PANTALLA) {
    return <Redirect to="/public-cola-simple" />;
  }
  if ([ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR].includes(idRol)) {
    return <Redirect to="/tablero-llamados-box" />;
  }

  // CANOSYS: conserva el inicio heredado sólo para roles históricos aún existentes en la base.
  return <Tablero />;
};

export const routes = [
  {
    path: "/",
    label: "Inicio",
    // CANOSYS: código anterior conservado como referencia.
    // component: Tablero,
    component: InicioPorRol,
  },
  {
    path: "/public-turnos",
    label: "Pantalla Pública",
    component: PublicTurnos,
    public: true,                 // 👈 usa AppLayoutPublic
  },
  {
    path: "/public-cola-simple",
    label: "Pantalla Pública Cola Simple",
    component: PublicColaSimple,
    public: true,                 // 👈 usa AppLayoutPublic
  },
  {
    path: "/atencion",
    label: "Tablero de Atencion",
    component: TableroAtencion,
  },
  // CANOSYS: registra la nueva vista administrativa de llamados de BOXes.
  {
    path: "/tablero-llamados-box",
    label: "Panel de llamados de BOXes",
    component: TableroLlamadosBox,
  },
  // CANOSYS: registra el reporte operativo propio de ENTER_LLAMADOR.
  {
    path: "/resumen/llamados-box",
    label: "Reporte de llamados de BOXes",
    component: InformeLlamadosBox,
  },
  {
    path: "/acceder",
    label: "INICIAR SESION",
    component: Login,
    // esta la podés dejar sin public, porque ya manejás login aparte
  },
  {
    path: "/gestion/lista-personas-visitantes",
    label: "Personas visitantes",
    component: ListaPersonasVisitantes,
  },
  {
    path: "/gestion/lista-usuarios-guardias",
    label: "Usuarios registrados",
    component: ListaUsuarioGuardias,
  },
  {
    path: "/gestion/lista-dependencias",
    label: "Dependencias registradas",
    component: ListaDependencia,
  },
  {
    path: "/gestion/alta-tramite",
    label: "Alta de tramites",
    component: NuevoTramite,
  },
  {
    path: "/gestion/lista-tramites",
    label: "Tramites",
    component: ListaTramites,
  },
  {
    path: "/gestion/alta-puntoatencion",
    label: "Alta de puntos",
    component: NuevoPunto,
  },
  {
    path: "/gestion/lista-puntoatencion",
    label: "Puntos de Atencion",
    component: ListaPuntos,
  },
  // CANOSYS: registra una ruta exclusiva para la configuración operativa y multimedia.
  {
    path: "/gestion/configuracion-pantalla-publica",
    label: "Configuración de Pantalla Pública",
    component: ConfiguracionPantallaPublica,
  },
  {
    path: "/gestion/alta-dependencia",
    label: "Alta de dependencia",
    component: NuevaDependencia,
  },
  {
    path: "/movimientos/lista-movimientos",
    label: "Control de Acceso",
    component: ListaAccesoVisitantes,
  },
  {
    path: "/movimientos/lista-movimientos-dos",
    label: "Acceso de visitantes por marcación de guardias",
    component: ListaAccesoVisitantesDos,
  },
  {
    path: "/movimientos/turnero",
    label: "Turnero",
    component: Turnero,
  },
  {
    path: "/movimientos/llamador",
    label: "Llamador",
    component: LlamadorTurnos,
  },
  {
    path: "/movimientos/contraseña",
    label: "Cambiar contraseña",
    component: Contraseña,
  },
  {
    path: "/movimientos/errores",
    label: "Errores lectura",
    component: ErroresLectura,
  },
  {
    path: "/movimientos/lista-movimientos-usuarios",
    label: "Marcaciones",
    component: ListaAccesoUsuarios,
  },
  {
    path: "/movimientos/llamador-cola-simple",
    label: "Panel de Atención",
    component: LlamadorColaSimple,
  },
  {
    path: "/resumen/entradas",
    label: "Entradas",
    component: ListaEntradasDia,
  },
  {
    path: "/resumen/salidas",
    label: "Salidas",
    component: ListasSalidasDia,
  },
  {
    path: "/resumen/permanencia",
    label: "Permanencia",
    component: ListaPermanenciaDia,
  },
  {
    path: "/resumen/informe-movimientos",
    label: "Informe Atencion",
    component: InformeMovimientos,
  },
  {
    path: "/resumen/grafico-usuarios",
    label: "Grafico Usuarios",
    component: InformeGraficoUsuarios,
  },
  {
    path: "/resumen/grafico-tramites",
    label: "Grafico Tramites",
    component: InformeGraficoTramites,
  },
  {
    path: "/resumen/tiempos-espera",
    label: "Grafico Tiempos",
    component: InformeTiemposEspera,
  },
  {
    path: "*",
    label: "Error en la página",
    component: NotFound,
    public: true, // si querés que el 404 sea sin NavBar
  },
];
