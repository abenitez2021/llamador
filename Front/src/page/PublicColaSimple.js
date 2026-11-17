// CANOSYS: código anterior conservado.
// import React, { useEffect, useState } from "react";
// CANOSYS: conserva el anuncio activo para esperar su fin y cancelarlo al salir.
import React, { useEffect, useRef, useState } from "react";
// CANOSYS: secuencia de timbre y voz para el box disponible.
import { anunciarBox } from "../utils/anuncioBox";
// CANOSYS: código anterior conservado como referencia; Button pertenecía al control de prueba comentado.
// import { Typography, Box, Paper, Button } from "@material-ui/core";
// CANOSYS: la pantalla pública sólo importa los componentes activos.
import { Typography, Box, Paper } from "@material-ui/core";
import axios from "axios";
// CANOSYS: replica la iconografía de fecha/hora y clima utilizada en ENTER_TURNERO.
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import WbSunnyIcon from "@material-ui/icons/WbSunny";
// CANOSYS: identifica visualmente el estado de espera sin añadir información nueva.
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import "./PublicTurnos.css";
import { getApiUrl } from "../config/runtimeConfig";

// CANOSYS: código anterior conservado como referencia; la alerta se mostraba durante 10 segundos.
// const TIEMPO_MOSTRAR_MS = 10000;
// CANOSYS: código anterior conservado como referencia; el aviso permanecía visible durante 15 segundos.
// const TIEMPO_MOSTRAR_MS = 15000;
// CANOSYS: código anterior conservado como referencia; la duración estaba fijada en el build.
// const TIEMPO_MOSTRAR_MS = 5000;
// CANOSYS: conserva cinco segundos como respaldo hasta obtener la configuración de la Mini PC.
const DURACION_PREDETERMINADA_SEGUNDOS = 5;

export default function PublicColaSimple() {
  const [boxesDisponibles, setBoxesDisponibles] = useState([]);
  const [boxEnPantalla, setBoxEnPantalla] = useState(null);
  // CANOSYS: sincroniza duración y video sin requerir recompilar la Pantalla Pública.
  const [configuracionPantalla, setConfiguracionPantalla] = useState({
    duracionBoxSegundos: DURACION_PREDETERMINADA_SEGUNDOS,
    videoUrl: "/video.mp4",
  });

  const [horaActual, setHoraActual] = useState("");
  const [clima, setClima] = useState({
    ciudad: "Asunción",
    temperatura: "--",
    descripcion: "",
    icono: "",
  });

  const apiKey = "86efa0d73f1094e7f7a768710d1c0eb3";

  // CANOSYS: actualiza periódicamente la configuración para aplicar cambios administrativos en ejecución.
  useEffect(() => {
    const obtenerConfiguracionPantalla = async () => {
      try {
        const response = await fetch(getApiUrl("configuraciones/pantalla-publica"), { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setConfiguracionPantalla({
          duracionBoxSegundos: Number(data.duracionBoxSegundos) || DURACION_PREDETERMINADA_SEGUNDOS,
          videoUrl: data.videoUrl || "/video.mp4",
        });
      } catch (error) {
        console.error("Error al obtener configuración de Pantalla Pública:", error);
      }
    };
    obtenerConfiguracionPantalla();
    const intervalo = setInterval(obtenerConfiguracionPantalla, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // CANOSYS: código anterior conservado; campana sin anuncio de voz.
  //   // 🔔 MISMA FUNCIÓN QUE EN PublicTurnos
  //   const reproducirCampana = () => {
  //     const audio = new Audio("/sonidos/sonido.mp3");
  //     audio.volume = 1;
  //     audio.addEventListener("canplaythrough", () => {
  //       audio.play().catch((e) => console.error("Error al reproducir sonido:", e));
  //     });
  //     audio.load();
  //   };
  // 
  // CANOSYS: detiene el sonido y la voz al abandonar la pantalla.
  const anuncioRef = useRef(null);
  useEffect(() => () => {
    if (anuncioRef.current) anuncioRef.current.cancel();
  }, []);

  // 🕒 Reloj digital (igual que PublicTurnos)
  useEffect(() => {
    // CANOSYS: bloquea el desplazamiento únicamente mientras esta pantalla pública está activa.
    document.documentElement.classList.add("public-turnos-activo");
    document.body.classList.add("public-turnos-activo");

    // CANOSYS: muestra la hora inmediatamente, sin esperar el primer intervalo.
    const actualizarHora = () => {
      const now = new Date();
      setHoraActual(
        now.toLocaleTimeString("es-PY", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    actualizarHora();
    const intReloj = setInterval(() => {
      actualizarHora();
    }, 1000);

    return () => {
      // CANOSYS: restaura el desplazamiento normal al abandonar la pantalla pública.
      document.documentElement.classList.remove("public-turnos-activo");
      document.body.classList.remove("public-turnos-activo");
      clearInterval(intReloj);
    };
  }, []);

  // 🌤 Clima (igual que PublicTurnos)
  const obtenerClima = async () => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Asuncion,py&appid=${apiKey}&units=metric&lang=es`
      );
      const data = res.data;
      setClima({
        ciudad: data.name,
        temperatura: `${Math.round(data.main.temp)}°C`,
        descripcion: data.weather[0].description,
        icono: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      });
    } catch (err) {
      console.error("Error al obtener clima:", err);
    }
  };

  const obtenerIconoClimaPersonalizado = (descripcion) => {
    const desc = (descripcion || "").toLowerCase();
    if (desc.includes("lluvia")) return "/icons/animated/rainy-1.svg";
    if (desc.includes("nieve")) return "/icons/animated/snowy-1.svg";
    if (desc.includes("nublado")) return "/icons/animated/cloudy.svg";
    if (desc.includes("parcialmente") || desc.includes("algo de"))
      return "/icons/animated/cloudy-day-1.svg";
    if (desc.includes("despejado") || desc.includes("soleado"))
      return "/icons/animated/day.svg";
    if (desc.includes("noche")) return "/icons/animated/night.svg";
    return "/icons/animated/cloudy.svg";
  };

  // 📡 Polling de boxes disponibles
  const obtenerBoxesDisponibles = async () => {
    try {
      // CANOSYS: código anterior conservado como referencia.
      // const res = await fetch("http://localhost:7001/api/puntoatencion/disponibles-cola");
      // CANOSYS: consulta la Mini PC que entregó la pantalla pública.
      const res = await fetch(getApiUrl("puntoatencion/disponibles-cola"));
      const data = await res.json();

      if (data.ok) {
        let ordenados = (data.boxes || []).slice().sort((a, b) => {
          if (!a.fecha_disponible || !b.fecha_disponible) return 0;
          return (
            new Date(a.fecha_disponible).getTime() -
            new Date(b.fecha_disponible).getTime()
          );
        });

        // 🔒 No vuelvas a poner en la cola el que ya está en pantalla
        if (boxEnPantalla) {
          ordenados = ordenados.filter(
            (b) => b.id !== boxEnPantalla.id
          );
        }

        setBoxesDisponibles(ordenados);
      } else {
        setBoxesDisponibles([]);
      }
    } catch (err) {
      console.error("Error al obtener boxes disponibles:", err);
    }
  };

  // Inicialización de clima + polling de boxes/clima
  useEffect(() => {
    obtenerBoxesDisponibles();
    obtenerClima();

    const intBoxes = setInterval(obtenerBoxesDisponibles, 3000);
    const intClima = setInterval(obtenerClima, 10 * 60 * 1000);

    return () => {
      clearInterval(intBoxes);
      clearInterval(intClima);
    };
    // importante: incluir boxEnPantalla para que el filtro se actualice
  }, [boxEnPantalla]); 

  // 🎬 EFECTO 1: elegir el siguiente box cuando no hay uno en pantalla
  useEffect(() => {
    if (boxEnPantalla) return; // ya estamos mostrando uno
    if (!boxesDisponibles || boxesDisponibles.length === 0) return;

    const siguiente = boxesDisponibles[0];
    if (!siguiente || !siguiente.id) return;

    setBoxEnPantalla(siguiente);
    // CANOSYS: código anterior conservado.
    // reproducirCampana();
    // CANOSYS: anuncia exactamente el box seleccionado en pantalla.
    anuncioRef.current = anunciarBox(siguiente);
  }, [boxesDisponibles, boxEnPantalla]);

  // CANOSYS: código anterior conservado como referencia; la duración dependía de TIEMPO_MOSTRAR_MS fijo.
  // setTimeout(..., TIEMPO_MOSTRAR_MS);
  // CANOSYS: retira el BOX al finalizar los segundos configurados por Administración.
  useEffect(() => {
    if (!boxEnPantalla) return;

    // CANOSYS: código anterior conservado; esperaba también la duración de la voz.
    // CANOSYS: respeta el temporizador definido desde Administración, sin extenderlo por audio.
    let cancelado = false;
    const anuncio = anuncioRef.current;
    const timeout = setTimeout(async () => {
      // CANOSYS: código anterior conservado; podía prolongar la permanencia configurada.
      // if (anuncio) await anuncio.finished;
      if (cancelado) return;
      // CANOSYS: detiene el anuncio al vencer el tiempo administrado para evitar superposiciones.
      if (anuncio) anuncio.cancel();
      try {
        // CANOSYS: código anterior conservado como referencia.
        // await fetch(`http://localhost:7001/api/puntoatencion/${boxEnPantalla.id}/ocupado`, { method: "POST" });
        // CANOSYS: confirma el estado del box en la API central.
        await fetch(getApiUrl(`puntoatencion/${boxEnPantalla.id}/ocupado`), {
          method: "POST",
        });
      } catch (err) {
        console.error("Error al marcar box ocupado:", err);
      } finally {
        // Lo removemos de la cola local
        setBoxesDisponibles((prev) =>
          prev.filter((b) => b.id !== boxEnPantalla.id)
        );
        // Liberamos para que el efecto anterior tome el siguiente
        setBoxEnPantalla(null);
      }
    }, configuracionPantalla.duracionBoxSegundos * 1000);

    // CANOSYS: código anterior conservado.
    // return () => clearTimeout(timeout);
    // CANOSYS: invalida también la espera asíncrona cuando cambia el efecto.
    return () => { cancelado = true; clearTimeout(timeout); };
  }, [boxEnPantalla, configuracionPantalla.duracionBoxSegundos]);

  return (
    <>
      {/* Mismo fondo de video que PublicTurnos */}
      <video id="bg-video" autoPlay muted loop>
        <source src="/institucional3.webm" type="video/webm" />
      </video>

      <Box className="pantalla">
        {/* Logo principal */}
        <Box className="logo">
          <img src="/empresalargo.png" alt="Logo" style={{ width: 1000 }} />
        </Box>

        {/* Contenedor principal con misma estructura que PublicTurnos */}
        <Box className="contenedor">
          {/* Panel central – sin tabla, solo mensaje grande de BOX disponible */}
          <Paper
            elevation={4}
            className={`panel panel-translucido turnos ${
              boxEnPantalla ? "borde-llamado" : ""
            }`}
          >
            {boxEnPantalla ? (
              <Box className="animacion-fade">
                {/* CANOSYS: conserva el texto del llamador y aplica la jerarquía de la alerta pública. */}
                <Typography component="p" className="llamado-label" align="center">
                  Punto de Atención Disponible
                </Typography>
                <Typography
                  component="p"
                  className="llamado-box-libre"
                  align="center"
                >
                  {boxEnPantalla.nombre || `BOX ${boxEnPantalla.id}`}
                </Typography>
                <Typography
                  component="p"
                  className="llamado-indicacion-box-libre"
                  align="center"
                >
                  {/* CANOSYS: código anterior conservado como referencia. */}
                  {/* Diríjase únicamente cuando vea su BOX en pantalla. */}
                  {/* CANOSYS: simplifica la indicación inferior confirmada para la alerta roja. */}
                  Diríjase al BOX en pantalla
                </Typography>
              </Box>
            ) : (
              <Box className="animacion-fade estado-espera-publico">
                {/* CANOSYS: código anterior conservado como referencia; los textos se mostraban sin composición propia. */}
                {/* <Box className="animacion-fade">...</Box> */}
                {/* CANOSYS: jerarquiza el mismo contenido del estado de espera con el lenguaje visual público. */}
                <span className="espera-icono" aria-hidden="true">
                  <NotificationsActiveIcon />
                </span>
                <Typography variant="h3" align="center" className="espera-titulo">
                  Esperando BOX disponible...
                </Typography>
                <span className="espera-separador" aria-hidden="true" />
                <Typography
                  variant="h5"
                  align="center"
                  className="espera-subtitulo"
                >
                  Por favor, permanezca atento a esta pantalla.
                </Typography>
                <Typography
                  variant="body1"
                  align="center"
                  className="espera-detalle"
                >
                  Cuando un punto de atención quede libre, se mostrará aquí
                  durante algunos segundos.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Columna lateral – igual a PublicTurnos: reloj + clima + icono + video */}
          {/* CANOSYS: código anterior conservado como referencia; la columna dependía de estilos inline. */}
          {/* <Box style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}> */}
          {/* CANOSYS: usa las mismas clases responsive de la pantalla pública de ENTER_TURNERO. */}
          <Box className="panel-info-publico">
            <Box className="paneles-estado">
              <Paper elevation={3} className="panel panel-translucido reloj">
                {/* CANOSYS: código anterior conservado como referencia. */}
                {/* <Typography variant="h6">🕒 Reloj Digital</Typography> */}
                <Typography variant="h6" className="titulo-estado">
                  <span className="icono-estado"><AccessTimeIcon /></span>
                  <span>Reloj Digital</span>
                </Typography>
                <Typography variant="h4" className="hora-digital">
                  {horaActual}
                </Typography>
              </Paper>

              <Paper elevation={3} className="panel panel-translucido clima">
                {/* CANOSYS: código anterior conservado como referencia. */}
                {/* <Typography variant="h6">🌤 Clima Actual</Typography> */}
                <Typography variant="h6" className="titulo-estado">
                  <span className="icono-estado"><WbSunnyIcon /></span>
                  <span>Clima Actual</span>
                </Typography>
                <Typography variant="body1">{clima.ciudad}</Typography>
                <Typography variant="h4">{clima.temperatura}</Typography>
                {/* CANOSYS: código anterior conservado como referencia; la descripción estaba separada de la nube. */}
                {/* <Typography variant="body2">{clima.descripcion}</Typography> */}
              </Paper>

              <Paper elevation={3} className="panel panel-translucido clima">
                {clima.descripcion && (
                  <>
                    <img
                      src={obtenerIconoClimaPersonalizado(clima.descripcion)}
                      alt={clima.descripcion}
                      className="icono-clima"
                    />
                    {/* CANOSYS: ubica la descripción meteorológica debajo de su icono. */}
                    <Typography variant="body2" className="descripcion-clima-icono">
                      {clima.descripcion}
                    </Typography>
                  </>
                )}
              </Paper>
            </Box>

            <Paper elevation={2} className="panel panel-translucido video">
              {/* CANOSYS: código anterior conservado como referencia; el video estaba fijado en /video.mp4. */}
              {/* <video src="/video.mp4" autoPlay muted loop /> */}
              {/* CANOSYS: reproduce el medio vigente informado por la Mini PC. */}
              <video key={configuracionPantalla.videoUrl} src={configuracionPantalla.videoUrl} autoPlay muted loop />
            </Paper>
          </Box>
        </Box>

        {/* Botón inferior – igual estructura que PublicTurnos
        <Button
          variant="contained"
          color="primary"
          onClick={reproducirCampana}
          fullWidth
        >
          Buscar
        </Button>
         */}
      </Box>
    </>
  );
}
