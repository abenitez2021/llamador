// CANOSYS: concentra en una vista administrativa la duración del aviso y el video institucional.
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import SaveIcon from "@material-ui/icons/Save";
import axios from "../../utils/axios";
import swal from "sweetalert";

// CANOSYS: utiliza el mismo rango validado por la API para dar respuesta inmediata en pantalla.
const DURACION_MINIMA = 1;
const DURACION_MAXIMA = 120;

export default function ConfiguracionPantallaPublica() {
  const [configuracion, setConfiguracion] = useState(null);
  const [duracion, setDuracion] = useState(5);
  const [video, setVideo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // CANOSYS: recupera la configuración efectiva para que Administración edite sobre valores reales.
  const cargarConfiguracion = async () => {
    try {
      const response = await axios.get("configuraciones/pantalla-publica");
      setConfiguracion(response.data);
      setDuracion(Number(response.data.duracionBoxSegundos) || 5);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // CANOSYS: guarda duración y video como operaciones independientes para no perder una carga válida.
  const guardarConfiguracion = async () => {
    const segundos = Number(duracion);
    if (!Number.isInteger(segundos) || segundos < DURACION_MINIMA || segundos > DURACION_MAXIMA) {
      swal("Duración no válida", `Ingrese un número entero entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} segundos.`, "warning");
      return;
    }

    try {
      setGuardando(true);
      await axios.put("configuraciones/pantalla-publica", { duracionBoxSegundos: segundos });

      if (video) {
        const formData = new FormData();
        formData.append("video", video);
        await axios.post("configuraciones/pantalla-publica/video", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await cargarConfiguracion();
      setVideo(null);
      // CANOSYS: limpia el selector nativo para permitir volver a elegir el mismo archivo.
      const input = document.getElementById("video-pantalla-publica");
      if (input) input.value = "";
      swal("Configuración guardada", "La Pantalla Pública tomará los cambios automáticamente.", "success");
    } catch (error) {
      // CANOSYS: presenta el mensaje validado por la API cuando está disponible.
      swal("No se pudo guardar", error?.response?.data?.message || "Revise el archivo y vuelva a intentar.", "error");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        {/* CANOSYS: separa la duración operativa del contenido multimedia para facilitar su comprensión. */}
        <Paper elevation={3} style={{ padding: 24, height: "100%" }}>
          <Typography variant="h6" gutterBottom>Duración del BOX libre</Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Cantidad de segundos que el aviso rojo permanece visible antes de mostrar el siguiente BOX.
          </Typography>
          <TextField
            type="number"
            label="Segundos en pantalla"
            variant="outlined"
            fullWidth
            value={duracion}
            onChange={(event) => setDuracion(event.target.value)}
            inputProps={{ min: DURACION_MINIMA, max: DURACION_MAXIMA, step: 1 }}
            helperText={`Valor permitido: ${DURACION_MINIMA} a ${DURACION_MAXIMA} segundos.`}
          />
        </Paper>
      </Grid>

      <Grid item xs={12} md={7}>
        {/* CANOSYS: permite revisar el video vigente antes de cargar su reemplazo. */}
        <Paper elevation={3} style={{ padding: 24 }}>
          <Typography variant="h6" gutterBottom>Video de la Pantalla Pública</Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Video actual: <strong>{configuracion?.videoNombre || "video.mp4"}</strong>. Formatos admitidos: MP4, WebM y Ogg; máximo 500 MB.
          </Typography>
          <Box bgcolor="#101820" borderRadius={8} overflow="hidden" mb={2}>
            <video
              key={configuracion?.videoUrl}
              src={configuracion?.videoUrl || "/video.mp4"}
              controls
              muted
              style={{ display: "block", width: "100%", maxHeight: 300 }}
            />
          </Box>
          <input
            id="video-pantalla-publica"
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={(event) => setVideo(event.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          <label htmlFor="video-pantalla-publica">
            <Button variant="outlined" color="primary" component="span" startIcon={<CloudUploadIcon />}>
              Seleccionar video
            </Button>
          </label>
          {video && <Typography variant="body2" style={{ marginTop: 10 }}>{video.name}</Typography>}
        </Paper>
      </Grid>

      <Grid item xs={12}>
        {/* CANOSYS: ejecuta una única confirmación visible para todos los cambios pendientes. */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={guardando}
            onClick={guardarConfiguracion}
          >
            {guardando ? "Guardando..." : "Guardar configuración"}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
}
