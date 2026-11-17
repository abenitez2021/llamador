import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  Divider,
  CircularProgress,
} from "@material-ui/core";
import PersonIcon from "@material-ui/icons/Person";
import RoomIcon from "@material-ui/icons/Room";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import axios from "../../utils/axios";
import swal from "sweetalert";
import { alertWarningError } from "../../components/Notificaciones";
// CANOSYS: estilos específicos del llamador simple, inspirados en la jerarquía visual de ENTER_TURNERO.
import "./LlamadorColaSimple.css";

// CANOSYS: código anterior conservado como referencia; el llamador mostraba 15 segundos de bloqueo.
// const DURACION_AVISO_SEGUNDOS = 15;
// CANOSYS: código anterior conservado como referencia; el contador estaba fijado en el build.
// const DURACION_AVISO_SEGUNDOS = 5;
// CANOSYS: mantiene cinco segundos como respaldo si la configuración aún no pudo cargarse.
const DURACION_AVISO_PREDETERMINADA = 5;

export default function LlamadorColaSimple() {
  const [puntosAtencion, setPuntosAtencion] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState("");
  const [ultimaLlamada, setUltimaLlamada] = useState(null);
  // CANOSYS: evita envíos simultáneos y comunica el período visible del aviso.
  const [enviando, setEnviando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [duracionAvisoSegundos, setDuracionAvisoSegundos] = useState(DURACION_AVISO_PREDETERMINADA);

  // 🧍 Usuario logueado (mismo esquema que usás en LlamadorTurnos)
  const rawJwt = sessionStorage.getItem("jwt-wom");
  const usuarioLogueado = rawJwt
    ? JSON.parse(JSON.parse(rawJwt).user ? rawJwt : "{}").user
    : null;

  // 📌 Cargar puntos de atención activos
  useEffect(() => {
    const cargarPuntosAtencion = async () => {
      try {
        const res = await axios.get("puntoatencion/listar/");
        if (res.status === 200) {
          setPuntosAtencion(res.data.filter((p) => p.activo));
        }
      } catch (err) {
        console.error("Error al cargar puntos de atención:", err);
        alertWarningError({
          data: {
            message: "Error al cargar puntos de atención.",
            level: "error",
          },
        });
      }
    };

    cargarPuntosAtencion();

    // CANOSYS: recupera la última llamada persistida del operador después de recargar o volver a ingresar.
    const cargarUltimaLlamada = async () => {
      try {
        const res = await axios.get("puntoatencion/ultima-llamada");
        if (res.data?.ok) {
          setUltimaLlamada(res.data.result || null);
        }
      } catch (err) {
        console.error("Error al cargar la última llamada:", err);
      }
    };
    cargarUltimaLlamada();

    // CANOSYS: utiliza la misma duración que la Pantalla Pública para informar el bloqueo al operador.
    const cargarDuracionAviso = async () => {
      try {
        const res = await axios.get("configuraciones/pantalla-publica");
        setDuracionAvisoSegundos(Number(res.data?.duracionBoxSegundos) || DURACION_AVISO_PREDETERMINADA);
      } catch (err) {
        console.error("Error al cargar duración de Pantalla Pública:", err);
      }
    };
    cargarDuracionAviso();

    // Si ya eligió un box antes, lo recuperamos del localStorage
    const guardado = localStorage.getItem("box-atencion");
    if (guardado) {
      setPuntoSeleccionado(guardado);
    }
  }, []);

  const nombreBoxSeleccionado = () => {
    const p = puntosAtencion.find(
      (pt) => String(pt.id) === String(puntoSeleccionado)
    );
    return p?.nombre || (puntoSeleccionado ? `BOX ${puntoSeleccionado}` : "");
  };

  const handleCambiarPunto = (e) => {
    const value = e.target.value;
    setPuntoSeleccionado(value);
    localStorage.setItem("box-atencion", String(value));
    // CANOSYS: código anterior conservado como referencia; ocultaba un dato histórico válido al cambiar de box.
    // setUltimaLlamada(null);
  };

  // CANOSYS: actualiza el estado visual durante los 15 segundos del aviso sin crear más llamadas.
  useEffect(() => {
    if (segundosRestantes <= 0) return undefined;

    const intervalo = setInterval(() => {
      setSegundosRestantes((actual) => Math.max(0, actual - 1));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [segundosRestantes]);

  // 👉 Acción principal: avisar que el box está libre
  const handleLlamarSiguiente = useCallback(async () => {
    // CANOSYS: impide dobles clics y repeticiones con teclado mientras el aviso está activo.
    if (enviando || segundosRestantes > 0) return;

    if (!puntoSeleccionado) {
      alertWarningError({
        data: {
          message: "Debe seleccionar en qué Punto de Atención va a trabajar.",
          level: "warning",
        },
      });
      return;
    }

    if (!usuarioLogueado) {
      alertWarningError({
        data: {
          message: "No se encontró información del usuario logueado.",
          level: "error",
        },
      });
      return;
    }

    try {
      setEnviando(true);
      // CANOSYS: código anterior conservado como referencia; el navegador enviaba el ID de usuario.
      // const payload = { id_usuario: usuarioLogueado.id };
      // CANOSYS: el backend toma el operador desde el token autenticado para registrar un historial confiable.
      const res = await axios.post(
        `puntoatencion/${puntoSeleccionado}/disponible`,
        {}
      );

      if (res.data?.ok && !res.data?.alreadyQueued) {
        // CANOSYS: código anterior conservado como referencia; usaba la hora local del navegador.
        // const ahora = new Date(); setUltimaLlamada({ box: nombreBoxSeleccionado(), hora: ahora.toLocaleTimeString() });
        // CANOSYS: muestra exactamente el registro creado por MySQL.
        setUltimaLlamada(res.data.result || null);
        // CANOSYS: código anterior conservado como referencia; usaba DURACION_AVISO_SEGUNDOS constante.
        // setSegundosRestantes(DURACION_AVISO_SEGUNDOS);
        // CANOSYS: refleja la duración administrativa vigente en el contador del llamador.
        setSegundosRestantes(duracionAvisoSegundos);

        swal("¡BOX libre!", "El siguiente ya puede ver tu box en la pantalla.", {
          icon: "success",
          buttons: false,
          timer: 1200,
        });
      } else if (res.data?.alreadyQueued) {
        // CANOSYS: informa el estado existente sin presentarlo como una llamada nueva.
        alertWarningError({
          data: {
            message: res.data.message,
            level: "warning",
          },
        });
      } else {
        alertWarningError({
          data: {
            message:
              res.data?.message ||
              "No se pudo marcar el box como disponible.",
            level: "error",
          },
        });
      }
    } catch (err) {
      console.error("❌ Error al marcar disponible:", err);
      alertWarningError({
        data: {
          message:
            err?.response?.data?.message ||
            "Error inesperado al marcar el box como disponible.",
          level: "error",
        },
      });
    } finally {
      // CANOSYS: habilita nuevamente la acción cuando finaliza la solicitud HTTP.
      setEnviando(false);
    }
  }, [puntoSeleccionado, usuarioLogueado, puntosAtencion, enviando, segundosRestantes, duracionAvisoSegundos]);

  // 🧿 Atajo de teclado: Barra espaciadora para llamar rápido
  useEffect(() => {
    const handler = (e) => {
      // CANOSYS: código anterior conservado como referencia; capturaba Espacio incluso dentro de controles.
      // if (e.code === "Space") { e.preventDefault(); handleLlamarSiguiente(); }
      // CANOSYS: ignora escritura, selecciones, repeticiones y avisos todavía activos.
      const tag = e.target?.tagName?.toLowerCase();
      const estaEditando = ["input", "select", "textarea", "button"].includes(tag) || e.target?.isContentEditable;
      if (e.code === "Space" && !e.repeat && !estaEditando && !enviando && segundosRestantes === 0) {
        e.preventDefault();
        handleLlamarSiguiente();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleLlamarSiguiente, enviando, segundosRestantes]);

  return (
    // CANOSYS: código anterior conservado como referencia; la vista usaba padding y estilos inline aislados.
    // <Box style={{ padding: 24 }}>...</Box>
    // CANOSYS: organiza el llamador como una superficie operativa responsive y coherente.
    <Box className="llamador-simple-page">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* CANOSYS: código anterior conservado como referencia. */}
          {/* <Typography>Panel de Atención – Cola Simple</Typography> */}
          {/* CANOSYS: encabezado propio del producto, inspirado en ENTER_TURNERO sin copiar su llamador complejo. */}
          <Box className="llamador-simple-header">
            <span className="llamador-simple-header-icon"><NotificationsActiveIcon /></span>
            <Box>
              <Typography component="h1" className="llamador-simple-title">
                Llamador de box libre
              </Typography>
              <Typography className="llamador-simple-subtitle">
                Seleccioná tu box y avisá cuando quede disponible para la siguiente persona.
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Columna izquierda – info del operador */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={3}
            className="llamador-simple-card llamador-simple-config"
          >
            <Box display="flex" alignItems="center" mb={1}>
              <span className="llamador-simple-section-icon"><PersonIcon /></span>
              <Box>
                <Typography variant="subtitle1" className="llamador-simple-section-title">
                  Operador en atención
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {usuarioLogueado
                    ? `${usuarioLogueado.nombre} ${usuarioLogueado.apellido}`
                    : "Usuario no identificado"}
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Typography variant="subtitle2" gutterBottom>
              Seleccione en qué Punto de Atención va a trabajar hoy:
            </Typography>

            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Punto de Atención</InputLabel>
              <Select
                value={puntoSeleccionado}
                onChange={handleCambiarPunto}
                label="Punto de Atención"
              >
                {puntosAtencion.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Box seleccionado:
              </Typography>
              {puntoSeleccionado ? (
                <Chip
                  icon={<RoomIcon />}
                  label={nombreBoxSeleccionado()}
                  style={{
                    marginTop: 4,
                    backgroundColor: "#e3f2fd",
                    color: "#0d47a1",
                    fontWeight: "bold",
                  }}
                />
              ) : (
                <Chip
                  label="Ningún box seleccionado"
                  style={{ marginTop: 4 }}
                  color="default"
                  size="small"
                />
              )}
            </Box>

            {/* CANOSYS: reemplaza el texto temporal por una tarjeta alimentada desde el historial del servidor. */}
            <Box className={`llamador-simple-last-call ${ultimaLlamada ? "has-data" : ""}`}>
              <span className="llamador-simple-last-icon"><AccessTimeIcon /></span>
              <Box>
                <Typography variant="caption" className="llamador-simple-last-label">
                  Última llamada realizada
                </Typography>
                <Typography className="llamador-simple-last-value">
                  {ultimaLlamada
                    ? `${ultimaLlamada.box} · ${ultimaLlamada.hora}`
                    : "Aún no hay llamadas registradas"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Columna derecha – botón grande de acción */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={4}
            className="llamador-simple-card llamador-simple-action"
          >
            <span className={`llamador-simple-action-icon ${segundosRestantes > 0 ? "active" : ""}`}>
              {segundosRestantes > 0 ? <CheckCircleOutlineIcon /> : <NotificationsActiveIcon />}
            </span>
            <Typography
              variant="h6"
              gutterBottom
              className="llamador-simple-action-title"
            >
              {/* CANOSYS: código anterior conservado como referencia. */}
              {/* Cuando estés libre, avisá al siguiente de la fila */}
              Cuando tu box quede libre, enviá el aviso
            </Typography>

            <Typography
              variant="body2"
              className="llamador-simple-action-copy"
            >
              Al presionar el botón, la pantalla pública mostrará:
              <br />
              {/* CANOSYS: código anterior conservado como referencia. */}
              {/* <b>“Puede pasar al BOX X”</b> con sonido. */}
              <b>“Punto de Atención Disponible · {nombreBoxSeleccionado() || "BOX X"}”</b>
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleLlamarSiguiente}
              disabled={!puntoSeleccionado || enviando || segundosRestantes > 0}
              startIcon={enviando ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              className="llamador-simple-main-button"
            >
              {/* CANOSYS: código anterior conservado como referencia. */}
              {/* Llamar siguiente a BOX */}
              {enviando
                ? "Enviando aviso..."
                : segundosRestantes > 0
                  ? `Aviso enviado · ${segundosRestantes}s`
                  : puntoSeleccionado
                    ? `Avisar ${nombreBoxSeleccionado()} libre`
                    : "Seleccione un Punto de Atención"}
            </Button>

            <Typography
              variant="caption"
              className="llamador-simple-shortcut"
            >
              Tip: también podés presionar la tecla{" "}
              <b>ESPACIO</b> para llamar al siguiente.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
