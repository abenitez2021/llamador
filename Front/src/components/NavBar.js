import React, { useState, memo, useContext, useEffect } from "react";
import clsx from "clsx";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Divider from "@material-ui/core/Divider";
import { makeStyles, useTheme } from "@material-ui/core/styles";
// CANOSYS: replica el menú adaptable de ENTER_TURNERO en resoluciones compactas.
import useMediaQuery from "@material-ui/core/useMediaQuery";
import MenuIcon from "@material-ui/icons/Menu";
import { useHistory } from "react-router-dom";
import List from "@material-ui/core/List";
import Drawer from "@material-ui/core/Drawer";
import Chip from "@material-ui/core/Chip";
import logo from "../assets/images/logo-color.png"
// import logo from "../assets/images/logo.png";
import AvatarIcon from "../assets/images/avatar.png";
import Avatar from "@material-ui/core/Avatar";
import Exit from "@material-ui/icons/ExitToApp";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import UserContext from "../utils/user/UserContext";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import DashboardIcon from '@material-ui/icons/Dashboard';
// CANOSYS: replica la iconografía semántica del menú visual de ENTER_TURNERO.
import TvIcon from "@material-ui/icons/Tv";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import HowToRegIcon from "@material-ui/icons/HowToReg";
import ConfirmationNumberIcon from "@material-ui/icons/ConfirmationNumber";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import CallReceivedIcon from "@material-ui/icons/CallReceived";
import CallMadeIcon from "@material-ui/icons/CallMade";
import ScheduleIcon from "@material-ui/icons/Schedule";
import AssessmentIcon from "@material-ui/icons/Assessment";
// CANOSYS: identifica visualmente el nuevo panel de llamados de BOXes.
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import PieChartIcon from "@material-ui/icons/PieChart";
import BarChartIcon from "@material-ui/icons/BarChart";
import TimerIcon from "@material-ui/icons/Timer";
import PersonIcon from "@material-ui/icons/Person";
import PeopleIcon from "@material-ui/icons/People";
import BusinessIcon from "@material-ui/icons/Business";
import RoomIcon from "@material-ui/icons/Room";
import AssignmentIcon from "@material-ui/icons/Assignment";
import LockIcon from "@material-ui/icons/Lock";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
// CANOSYS: identifica la configuración específica de la Pantalla Pública.
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import TypographyBold from "./TypographyBold";
import Button from "@material-ui/core/Button";
import swal from "sweetalert";

import axios from "../utils/axios";
import { alertWarningError, } from "../components/Notificaciones";
import { ROLE_IDS, hasRoleId } from "../config/roleIds";


const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
    //  background: "rgb(96, 235, 82)",
    //background: "linear-gradient(140deg,rgba(11, 190, 113, 1) 0%,rgb(255 ,234 , 234 ) 100%)",
    // CANOSYS: replica la distribución adaptable del encabezado actual de ENTER_TURNERO.
    gap: theme.spacing(1),
    minWidth: 0,
    [theme.breakpoints.down("sm")]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // CANOSYS: código anterior conservado como referencia.
    // padding: "0 12px",
    // ...theme.mixins.toolbar,
    // CANOSYS: replica el área institucional amplia del menú de ENTER_TURNERO.
    padding: "30px 30px",
    backgroundColor: "#FFFFFF	",
  },

  appBar: {
    // CANOSYS: código anterior conservado como referencia; correspondía al encabezado azul sólido antiguo.
    // backgroundColor: "#157592",
    // CANOSYS: usa exactamente el degradado translúcido vigente en ENTER_TURNERO.
    background: "linear-gradient(to right,#8e44ad70,#22c0c370)",
    color: "#ffffff",
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
    // CANOSYS: conserva el comportamiento visual adaptable de ENTER_TURNERO.
    [theme.breakpoints.down("sm")]: {
      marginRight: theme.spacing(1),
    },
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
  },
  // CANOSYS: distribuye el usuario y las acciones sin anchos fijos en la barra superior.
  userArea: {
    display: "flex",
    flex: "1 1 auto",
    minWidth: 0,
    overflow: "hidden",
  },
  // CANOSYS: mantiene alineado el bloque de identidad del usuario.
  userList: {
    display: "flex",
    flex: "1 1 auto",
    minWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  // CANOSYS: evita que nombres extensos deformen el encabezado.
  userMenuItem: {
    width: "100%",
    minWidth: 0,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    "& .MuiListItemText-root": { minWidth: 0 },
    "& .MuiListItemText-primary": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 0,
      paddingRight: 0,
      "& .MuiListItemText-primary": { fontSize: "0.82rem" },
    },
  },
  // CANOSYS: conserva visible la salida en todos los anchos.
  exitButton: {
    marginLeft: "auto",
    flexShrink: 0,
  },
  drawerPaper: {
    position: "relative",
    // CANOSYS: replica el desplazamiento discreto del menú de ENTER_TURNERO.
    "&::-webkit-scrollbar": {
      width: "8px",
      backgroundColor: "transparent",
    },
    "&:hover::-webkit-scrollbar": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: "4px",
    },
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255, 255, 255, 0.8) transparent",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  // CANOSYS: superpone el menú en tablet y teléfono para no comprimir las secciones internas.
  drawerPaperTemporary: {
    position: "fixed",
    width: `min(82vw, ${drawerWidth}px)`,
    maxWidth: drawerWidth,
    paddingTop: 64,
    [theme.breakpoints.down("xs")]: {
      paddingTop: 56,
    },
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(0), // permite ajustar si se oculta o no todo el menu lateral , valor original 7
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(0),// permite ajustar si se oculta o no todo el menu lateral, valor original 9
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
  },

  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },

  active: {
    // CANOSYS: código anterior conservado como referencia; resaltaba la opción activa en azul.
    // backgroundColor: "rgb(0 74 173 / 20%)",
    // CANOSYS: usa el resaltado violeta exacto de ENTER_TURNERO.
    backgroundColor: "rgb(142 68 173 / 30%)",
  },

  activeModule: {

    backgroundColor: "rgb(240 159 84  / 30% )",
  },
  nested: {
    paddingLeft: theme.spacing(2),
  },
  agrupador: {
    margin: theme.spacing(2, 1, 1, 2),
    color: "#6b6e71",
  },
}));

// CANOSYS: código anterior conservado como referencia.
// const drawerWidth = 230;
// CANOSYS: iguala la proporción del menú lateral vigente en ENTER_TURNERO.
const drawerWidth = 290;

// CANOSYS: centraliza tamaño y color para que todos los íconos del menú sean coherentes.
function NavigationIcon({ icon: Icon }) {
  return (
    <ListItemIcon style={{ minWidth: 34 }}>
      <Icon fontSize="small" style={{ color: "#157592" }} />
    </ListItemIcon>
  );
}

function NavBar() {
  const history = useHistory();
  const userContext = useContext(UserContext);
  // CANOSYS: código anterior conservado como referencia.
  // const [open, setOpen] = useState(true);
  // CANOSYS: conserva el menú permanente en escritorio y temporal en anchos compactos.
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(!isCompact);
  const [anchorEl, setAnchorEl] = useState(null);
  const [auth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const openMenu = Boolean(anchorEl);
  const pathName = window.location.pathname.split("/");
  const classes = useStyles();
  // CANOSYS: código anterior conservado como referencia; el menú comparaba nombres de roles.
  // userContext.state.rol === "Administrador"
  // CANOSYS: replica el patrón de ENTER_TURNERO y autoriza todas las opciones mediante IDs estables.
  const hasCurrentRole = (...roleIds) =>
    hasRoleId(userContext.state.idRol, ...roleIds);
  // CANOSYS: código anterior conservado en este archivo; los módulos heredados siguen disponibles para una eventual auditoría.
  // CANOSYS: oculta del menú productivo las opciones ajenas a ENTER_LLAMADOR sin borrar sus implementaciones.
  const SHOW_LEGACY_MODULES = false;

  const [marcarButtonText, setMarcarButtonText] = useState("Marcar Entrada");

  useEffect(() => {
    // Escucha cambios en userContext.state.marcacion y actualiza marcarButtonText
    if (userContext.state.marcacion === "Entrada") {
      setMarcarButtonText("Marcar Salida");
    } else {
      setMarcarButtonText("Marcar Entrada");
    }
  }, [userContext.state.marcacion]);

  // CANOSYS: sincroniza visualmente el menú cuando cambia el ancho disponible.
  useEffect(() => {
    setOpen(!isCompact);
  }, [isCompact]);


  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  // CANOSYS: libera el contenido después de elegir una sección en modo compacto.
  const handleDrawerNavigation = () => {
    if (isCompact) {
      setOpen(false);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };


  const marcarSalidaUsuario = async () => {
    setIsLoading(true);
    let url = "/marcacion/marcar"
    try {
      const response = await axios.post(url)

      let status = response.status;
      if (status === 200) {

        userContext.clearUser();
        history.push("/");

      }
    } catch (error) {
      setIsLoading(false);
      if (error.response) {
        alertWarningError(error.response);
      }
    }
  };

  const marcarEntradaUsuario = async () => {
    setIsLoading(true);
    let url = "/marcacion/marcar"
    try {
      const response = await axios.post(url)

      let status = response.status;
      if (status === 200) {
        userContext.updateMarcacion("Entrada")
        swal("¡OPERACIÓN EXITOSA!", {
          icon: "success",
          buttons: false,
          timer: 1500,
        });

      }
    } catch (error) {
      setIsLoading(false);
      if (error.response) {
        alertWarningError(error.response);
      }
    }
  };

  const handleMarcarSalida = (event, props) => {
    event.stopPropagation();
    swal({
      title: "¡ATENCIÓN!",
      text: `¿Deseas marcar tu SALIDA del sistema?`,
      icon: "warning",
      buttons: true,
      buttons: ["Cancelar", "Confirmar"],
      confirmButtonColor: "#43a047",
    }).then((willDelete) => {
      if (willDelete) {
        marcarSalidaUsuario()
      }
    });
  };


  const handleMarcarEntrada = (event, props) => {
    event.stopPropagation();
    swal({
      title: "¡ATENCIÓN!",
      text: `¿Deseas marcar tu ENTRADA al sistema?`,
      icon: "warning",
      buttons: true,
      buttons: ["Cancelar", "Confirmar"],
      confirmButtonColor: "#43a047",
    }).then((willDelete) => {
      if (willDelete) {
        marcarEntradaUsuario()
      }
    });
  };

  const handleSalirHover = () => {
    swal("¿Desea cerrar sesión?", {
      buttons: ["Cancelar", "Cerrar Sesión"],
      dangerMode: true,
    }).then((willLogout) => {
      if (willLogout) {
        userContext.clearUser();
        history.push("/acceder");
      }
    });
  };

  return (
    <>
      <AppBar
        position="fixed"
        // CANOSYS: código anterior conservado como referencia: desplazaba la barra incluso con menú temporal.
        // CANOSYS: replica el desplazamiento exclusivo de escritorio de ENTER_TURNERO.
        className={clsx(classes.appBar, open && !isCompact && classes.appBarShift)}
        style={{
          boxShadow:
            "0px 1px 1px -1px rgb(0 0 0 / 10%), 0px 1px 3px 0px rgb(0 0 0 / 4%), 0px 1px 5px 0px rgb(0 0 0 / 12%)",
        }}
      >

        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>

          {open && (
            <IconButton color="inherit" onClick={handleDrawerClose}>
              <MenuOpenIcon />
            </IconButton>
          )}

          {/* CANOSYS: código anterior conservado como referencia; el separador vacío truncaba el nombre del usuario. */}
          {/* <ListItem style={{ paddingTop: 0, paddingBottom: 0 }}></ListItem> */}

          {auth && (
            /* CANOSYS: código anterior conservado como referencia: <div> sin control adaptable de ancho. */
            /* CANOSYS: aplica el área flexible del encabezado de ENTER_TURNERO. */
            <div className={classes.userArea}>
              {/* CANOSYS: código anterior conservado como referencia: classes.root y width fijo de 1000px. */}
              <List
                className={classes.userList}
              >
                {/* CANOSYS: código anterior conservado como referencia: ListItem con width fijo de 600px. */}
                <ListItem
                  button
                  onClick={handleMenu}
                  className={classes.userMenuItem}
                >
                  {/* CANOSYS: código anterior conservado como referencia: ListItemText sin control de desbordamiento. */}
                  <ListItemText
                    primary={userContext.state.nombre + " " + userContext.state.apellido + " - " + userContext.state.rol}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  {hasCurrentRole(ROLE_IDS.GUARDIA) && (
                    <Button
                      style={{ marginRight: 5, backgroundColor: userContext.state.marcacion === "Entrada" ? "#EE273E" : "#43a047" }}
                      color="inherit"
                      variant="contained"
                      onClick={userContext.state.marcacion === "Entrada" ? handleMarcarSalida : handleMarcarEntrada}
                    >
                      {marcarButtonText}
                    </Button>
                  )}

                </ListItem>
              </List>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                keepMounted
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={openMenu}
                onClose={handleClose}
              >
                <Divider />

                <MenuItem
                  onClick={(e) => {
                    userContext.clearUser();
                    history.push("/acceder");
                  }}
                >
                  <ListItemIcon onClick={() => handleClose()}>
                    <Exit color="secondary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Cerrar sesión" />
                </MenuItem>
              </Menu>
            </div>
          )}

          {/* Botón de Salir */}
          {/* CANOSYS: código anterior conservado como referencia: style={{ marginLeft: "auto" }}. */}
          <IconButton
            color="inherit"
            onClick={handleSalirHover}
            className={classes.exitButton}
            aria-label="Cerrar sesión"
          >
            <Exit />
          </IconButton>
        </Toolbar>
      </AppBar>
      {/* CANOSYS: código anterior conservado como referencia: variant="permanent". */}
      {/* CANOSYS: evita que el menú reduzca el área interna en vistas compactas. */}
      <Drawer
        variant={isCompact ? "temporary" : "permanent"}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            isCompact && classes.drawerPaperTemporary,
            !open && !isCompact && classes.drawerPaperClose
          ),
        }}
        open={open}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
      >
        <div className={classes.toolbarIcon}>
          {/* CANOSYS: código anterior conservado como referencia: width={110}. */}
          {/* CANOSYS: replica el tamaño institucional del menú vigente en ENTER_TURNERO. */}
          <img width={140} alt="Logo" src={logo} />
          <Chip
            variant="default"
            label="V2.0.1"
            size="small"
            style={{
              height: 15,
              fontSize: 8,
              marginLeft: 5,
              alignSelf: "end",
              marginBottom: 10,

              backgroundColor: "fff",
            }}
          />
        </div>
        <Divider />


        <>

          {/* CANOSYS: cierra el menú temporal después de navegar sin cambiar ninguna ruta. */}
          <List onClick={handleDrawerNavigation}>
            {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                <ListItem
                  button
                  onClick={() => history.push("/")}
                  className={pathName?.[1] === "" && classes.active}
                >
                  {/* CANOSYS: código anterior conservado como referencia: DashboardIcon inline. */}
                  <NavigationIcon icon={DashboardIcon} />
                  <ListItemText secondary="Tablero de Visitas" />
                </ListItem>
              )}
            {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                <ListItem
                  button
                  onClick={() => history.push("/atencion")}
                  className={pathName?.[1] === "atencion" && classes.active}
                >
                  {/* CANOSYS: código anterior conservado como referencia: DashboardIcon inline. */}
                  <NavigationIcon icon={AssessmentIcon} />
                  <ListItemText secondary="Tablero de Atencion" />
                </ListItem>
              )}
            {hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                // CANOSYS: añade acceso directo al tablero propio de ENTER_LLAMADOR.
                <ListItem
                  button
                  onClick={() => history.push("/tablero-llamados-box")}
                  className={pathName?.[1] === "tablero-llamados-box" && classes.active}
                >
                  <NavigationIcon icon={NotificationsActiveIcon} />
                  <ListItemText secondary="Llamados de BOXes" />
                </ListItem>
              )}
            {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.PANTALLA) && (
                <ListItem
                  button
                  onClick={() => history.push("/public-turnos")}
                  className={pathName?.[1] === "" && classes.active}
                >
                  {/* CANOSYS: código anterior conservado como referencia: DashboardIcon inline. */}
                  <NavigationIcon icon={TvIcon} />
                  <ListItemText secondary="Pantalla" />
                </ListItem>
              )}

              {hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.PANTALLA) && (
                  <ListItem
                    button
                    onClick={() => history.push("/public-cola-simple")}
                    className={pathName?.[1] === "public-cola-simple" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: DashboardIcon inline. */}
                    <NavigationIcon icon={TvIcon} />
                    <ListItemText secondary="Pantalla Cola Simple" />
                  </ListItem>
                )}

              

            <List component="div" disablePadding>
              {hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.LLAMADOR) && (
                  <TypographyBold variant="subtitle2" style={{ color: "#157592" }} className={classes.agrupador}>
                    Operación
                  </TypographyBold>)}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                  <ListItem
                    button
                    onClick={() => history.push("/movimientos/lista-movimientos-dos")}
                    className={pathName?.[2] === "lista-movimientos-dos" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={MeetingRoomIcon} />
                    <ListItemText secondary="Control de Acceso" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                <ListItem
                  button
                  onClick={() => history.push("/movimientos/lista-movimientos-usuarios")}
                  className={pathName?.[2] === "lista-movimientos-usuarios" && classes.active}
                >
                  {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                  <NavigationIcon icon={HowToRegIcon} />
                  <ListItemText secondary="Marcaciones" />
                </ListItem>
              )}

              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.TURNERO) && (
                  <ListItem
                    button
                    onClick={() => history.push("/movimientos/turnero")}
                    className={pathName?.[2] === "turnero" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={ConfirmationNumberIcon} />
                    <ListItemText secondary="Turnero" />
                  </ListItem>)
              }
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/movimientos/llamador")}
                    className={pathName?.[2] === "llamador" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={RecordVoiceOverIcon} />
                    <ListItemText secondary="Llamador" />
                  </ListItem>
                )}
              {hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.LLAMADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/movimientos/llamador-cola-simple")}
                    className={pathName?.[2] === "llamador-cola-simple" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={RecordVoiceOverIcon} />
                    <ListItemText secondary="Panel de Atención" />
                  </ListItem>
                )}
              


            </List>

            <List component="div" disablePadding>
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                  <TypographyBold variant="subtitle2" style={{ color: "#157592" }} className={classes.agrupador}>
                    Visitas del día
                  </TypographyBold>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/entradas/")}
                    className={pathName?.[2] === "entradas" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={CallReceivedIcon} />
                    <ListItemText secondary="Entradas" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/salidas")}
                    className={pathName?.[2] === "salidas" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={CallMadeIcon} />
                    <ListItemText secondary="Salidas" />
                  </ListItem>
                )}

              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.GUARDIA) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/permanencia/")}
                    className={pathName?.[2] === "permanencia" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={ScheduleIcon} />
                    <ListItemText secondary="Permanencia" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/informe-movimientos/")}
                    className={pathName?.[2] === "informe-movimientos" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={AssessmentIcon} />
                    <ListItemText secondary="Movimiento Atencion" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/grafico-usuarios/")}
                    className={pathName?.[2] === "grafico-usuario" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={BarChartIcon} />
                    <ListItemText secondary="Grafico de Usuarios" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/grafico-tramites/")}
                    className={pathName?.[2] === "grafico-tramites" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={PieChartIcon} />
                    <ListItemText secondary="Grafico de Tramites" />
                  </ListItem>
                )}
              {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/resumen/tiempos-espera/")}
                    className={pathName?.[2] === "tiempos-espera" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={TimerIcon} />
                    <ListItemText secondary="Tiempos de Atencion" />
                  </ListItem>
                )}
            </List>

            {hasCurrentRole(ROLE_IDS.ADMINISTRADOR, ROLE_IDS.SUPERVISOR) && (
              <List component="div" disablePadding>
                {/* CANOSYS: agrupa únicamente el informe propio del llamador de BOXes. */}
                <TypographyBold variant="subtitle2" style={{ color: "#157592" }} className={classes.agrupador}>
                  Reportes
                </TypographyBold>
                <ListItem
                  button
                  onClick={() => history.push("/resumen/llamados-box")}
                  className={pathName?.[2] === "llamados-box" && classes.active}
                >
                  <NavigationIcon icon={AssessmentIcon} />
                  <ListItemText secondary="Historial de llamados" />
                </ListItem>
              </List>
            )}

            {hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
              <List component="div" disablePadding>
                {hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <TypographyBold variant="subtitle2" style={{ color: "#157592" }} className={classes.agrupador}>
                    Administración
                  </TypographyBold>
                )}
                {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/gestion/lista-personas-visitantes/")}
                    className={pathName?.[2] === "lista-personas-visitantes" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={PersonIcon} />
                    <ListItemText secondary="Personas registradas" />
                  </ListItem>
                )}

                {hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/gestion/lista-usuarios-guardias")}
                    className={pathName?.[2] === "lista-usuarios-guardias" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={PeopleIcon} />
                    <ListItemText secondary="Usuarios registrados" />
                  </ListItem>
                )}
                {hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  // CANOSYS: añade al menú administrativo el acceso a duración y video de la Pantalla Pública.
                  <ListItem
                    button
                    onClick={() => history.push("/gestion/configuracion-pantalla-publica")}
                    className={pathName?.[2] === "configuracion-pantalla-publica" && classes.active}
                  >
                    <NavigationIcon icon={SettingsApplicationsIcon} />
                    <ListItemText secondary="Pantalla Pública" />
                  </ListItem>
                )}

                {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => {
                      history.push("/gestion/lista-dependencias/")
                    }}
                    className={pathName?.[2] === "lista-dependencias" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={BusinessIcon} />
                    <ListItemText secondary="Dependencias registradas" />
                  </ListItem>
                )}
                {hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/gestion/lista-puntoatencion/")}
                    className={pathName?.[2] === "lista-puntoatencion" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={RoomIcon} />
                    <ListItemText secondary="Puntos de Atencion" />
                  </ListItem>
                )}
                {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
                  <ListItem
                    button
                    onClick={() => history.push("/gestion/lista-tramites/")}
                    className={pathName?.[2] === "lista-tramites" && classes.active}
                  >
                    {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                    <NavigationIcon icon={AssignmentIcon} />
                    <ListItemText secondary="Tramites" />
                  </ListItem>
                )}

              </List>
            )}
            {hasCurrentRole(...Object.values(ROLE_IDS)) && (
                <TypographyBold variant="subtitle2" style={{ color: "#157592" }} className={classes.agrupador}>
                  Configuración
                </TypographyBold>
              )}
            {hasCurrentRole(...Object.values(ROLE_IDS)) && (
                <ListItem
                  button
                  onClick={() => history.push("/movimientos/contraseña")}
                  className={pathName?.[2] === "lista-movimientos-dos" && classes.active}
                >
                  {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                  <NavigationIcon icon={LockIcon} />
                  <ListItemText secondary="Cambiar contraseña" />
                </ListItem>
              )}
            {SHOW_LEGACY_MODULES && hasCurrentRole(ROLE_IDS.ADMINISTRADOR) && (
              <ListItem
                button
                onClick={() => history.push("/movimientos/errores")}
                className={pathName?.[2] === "lista-movimientos-dos" && classes.active}
              >
                {/* CANOSYS: código anterior conservado como referencia: ListIcon genérico. */}
                <NavigationIcon icon={ErrorOutlineIcon} />
                <ListItemText secondary="Errores de lectura" />
              </ListItem>
            )}
          </List>


        </>

      </Drawer>
    </>
  );
}

export default memo(NavBar);
