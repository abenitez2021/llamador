import React, { useContext } from "react";
import Navegacion from "./utils/navegacion/Navegacion";
import Container from "@material-ui/core/Container";
import UserContext from "./utils/user/UserContext";
import NavBar from "./components/NavBar";
import Login from "./page/Login";
import AccesoDenegado from "./components/AccesoDenegado";
import { canAccessRoute } from "./config/roleIds";
import { makeStyles } from '@material-ui/core/styles';
// CANOSYS: usa la misma cabecera visual reutilizable de ENTER_TURNERO.
import PageHeader from "./components/PageHeader";

// CANOSYS: estas vistas ya incluyen una cabecera operativa propia y no deben duplicarla.
const embeddedHeaderPaths = new Set([
  "/",
  "/atencion",
  // CANOSYS: evita duplicar la cabecera incluida en el nuevo tablero de BOXes.
  "/tablero-llamados-box",
  // CANOSYS: la vista de reporte incluye su propia cabecera visual.
  "/resumen/llamados-box",
  "/movimientos/llamador",
  "/movimientos/llamador-cola-simple",
  "/resumen/informe-movimientos",
  "/resumen/grafico-usuarios",
  "/resumen/grafico-tramites",
  "/resumen/tiempos-espera",
]);

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100vh', // Ensure the root takes full height
    // CANOSYS: evita desbordamientos al combinar el menú moderno con el contenido.
    width: '100%',
    minWidth: 0,
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    overflow: 'auto', // Allow content to scroll if needed
    padding: theme.spacing(3), // Add some padding
    // CANOSYS: replica el comportamiento adaptable del área interna de ENTER_TURNERO.
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1.5),
    },
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  // CANOSYS: espaciado común para todas las secciones autenticadas.
  layoutContainer: {
    paddingBottom: 5,
    marginTop: 15,
    [theme.breakpoints.down('sm')]: {
      marginTop: 8,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  // CANOSYS: limita la jerarquía de textos al contenido interno de cada vista.
  pageSurface: {
    minWidth: 0,
    '& > p': {
      color: 'rgba(255, 255, 255, 0.90)',
      fontWeight: 500,
      letterSpacing: '0.01em',
      textShadow: '0 1px 2px rgba(24, 42, 82, 0.22)',
    },
    // CANOSYS: replica el contraste blanco de los títulos heredados sobre el degradado de ENTER_TURNERO.
    '& > .MuiGrid-container > .MuiGrid-item > .MuiList-root > .MuiListItem-root > .MuiListItemText-root > .MuiListItemText-primary': {
      color: '#FFFFFF',
      fontWeight: 700,
      letterSpacing: '0.035em',
      textShadow: '0 1px 2px rgba(24, 42, 82, 0.24)',
    },
    // CANOSYS: conserva una jerarquía secundaria legible y coherente con la versión nueva.
    '& > .MuiGrid-container > .MuiGrid-item > .MuiList-root > .MuiListItem-root > .MuiListItemText-root > .MuiListItemText-secondary': {
      color: 'rgba(255, 255, 255, 0.78)',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
  },
  // CANOSYS: oculta únicamente la cabecera heredada cuando PageHeader ya presenta la sección.
  pageSurfaceWithSharedHeader: {
    '& > p:first-child': {
      display: 'none',
    },
    '& > .MuiGrid-container > .MuiGrid-item:first-child > .MuiList-root': {
      display: 'none',
    },
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
}));

function AppLayout({ route, theme, memoizedtoggleTheme }) {
  const Content = route.component;
  const classes = useStyles();
  const userContext = useContext(UserContext);
  // CANOSYS: valida la vista por ID de rol además de ocultar opciones en el menú.
  const tieneAcceso = canAccessRoute(route.path, userContext.state.idRol);
  // CANOSYS: determina visualmente si la página necesita la cabecera compartida.
  const showsEmbeddedHeader = embeddedHeaderPaths.has(route.path);

  return (
    <>
      {userContext.state.exp ? (
        <div className={classes.root}>
          <NavBar toggleTheme={memoizedtoggleTheme} />
          <main className={classes.content}>
            <div className={classes.appBarSpacer} />
            {route.parent && <Navegacion route={route} />}
            {/* CANOSYS: código anterior conservado como referencia. */}
            {/* <Container maxWidth="xl" style={{ paddingBottom: 5, marginTop: 15 }}> */}
            {/* CANOSYS: aplica la misma composición adaptable de ENTER_TURNERO. */}
            <Container maxWidth="xl" className={classes.layoutContainer}>
              {!showsEmbeddedHeader && (
                <PageHeader title={route.label} />
              )}
              {/* CANOSYS: delimita la capa visual sin cambiar la validación vigente por rol. */}
              <div
                className={`${classes.pageSurface} ${
                  !showsEmbeddedHeader ? classes.pageSurfaceWithSharedHeader : ""
                }`}
              >
                {/* CANOSYS: impide abrir manualmente una URL no autorizada para el rol autenticado. */}
                {tieneAcceso ? <Content /> : <AccesoDenegado />}
              </div>
            </Container>
          </main>
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default AppLayout;
