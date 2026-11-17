import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import NotificationsActiveIcon from "@material-ui/icons/NotificationsActive";
import MeetingRoomIcon from "@material-ui/icons/MeetingRoom";
import PeopleIcon from "@material-ui/icons/People";
import TvIcon from "@material-ui/icons/Tv";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../utils/axios";
import PageHeader from "../components/PageHeader";

// CANOSYS: usa la misma paleta determinística de ENTER_TURNERO para mantener coherencia visual.
const chartColors = ["#536d9f", "#8e5aa8", "#2f8795", "#d17b5f", "#6f8f58", "#c15d78"];

// CANOSYS: define el aspecto moderno y adaptable del panel específico de BOXes.
const useStyles = makeStyles((theme) => ({
  summaryCard: {
    height: "100%",
    borderRadius: 14,
    border: "1px solid rgba(36, 68, 95, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    boxShadow: "0 8px 22px rgba(28, 48, 74, 0.10)",
  },
  summaryContent: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(2),
    "&:last-child": { paddingBottom: theme.spacing(2) },
  },
  summaryAvatar: { width: 46, height: 46, flexShrink: 0 },
  summaryLabel: { color: "#5b6f80", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 },
  summaryValue: { color: "#24445f", fontSize: "1.45rem", fontWeight: 800, lineHeight: 1.25 },
  panelCard: {
    height: "100%",
    borderRadius: 14,
    border: "1px solid rgba(36, 68, 95, 0.12)",
    backgroundColor: "#ffffff",
    boxShadow: "0 10px 26px rgba(28, 48, 74, 0.12)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: theme.spacing(2, 2.5),
    borderBottom: "1px solid #e7ecf0",
    "& .MuiCardHeader-title": { color: "#24445f", fontWeight: 700, fontSize: "1.05rem" },
    "& .MuiCardHeader-subheader": { color: "#6b7d8c", marginTop: 3 },
  },
  panelContent: { padding: theme.spacing(2), "&:last-child": { paddingBottom: theme.spacing(2) } },
  chartArea: { width: "100%", height: 300 },
  emptyState: {
    height: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7d8c",
    textAlign: "center",
    padding: theme.spacing(3),
  },
  legend: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" },
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    padding: theme.spacing(0.75, 1),
    borderRadius: 8,
    backgroundColor: "#f7f9fb",
  },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginRight: theme.spacing(1) },
  legendLabel: { minWidth: 0, flex: 1, color: "#40566a", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  legendValue: { marginLeft: theme.spacing(1), color: "#24445f", fontWeight: 800 },
  tableContainer: { maxHeight: 355 },
  tableHead: { backgroundColor: "#f1f5f8" },
  tableHeadCell: { color: "#24445f", fontWeight: 800, whiteSpace: "nowrap" },
  tableCell: { color: "#40566a", borderBottom: "1px solid #edf1f4" },
  boxBadge: { display: "inline-block", padding: "5px 10px", borderRadius: 8, backgroundColor: "rgba(142, 68, 173, 0.12)", color: "#7a3d91", fontWeight: 800 },
  loadingState: { minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" },
  errorState: { padding: theme.spacing(2), borderRadius: 10, backgroundColor: "rgba(198, 40, 40, 0.08)", color: "#a32424" },
}));

// CANOSYS: muestra valores exactos y legibles al recorrer los gráficos.
function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <Box bgcolor="#ffffff" border="1px solid #dce4ea" borderRadius={8} boxShadow="0 6px 18px rgba(28, 48, 74, 0.14)" p={1.25}>
      <Typography variant="body2" style={{ color: "#40566a" }}>{item.payload?.nombre || label}</Typography>
      <Typography variant="subtitle2" style={{ color: "#24445f", fontWeight: 800 }}>Llamados: {item.value}</Typography>
    </Box>
  );
}

// CANOSYS: presenta únicamente actividad persistida del llamador de box libre.
export default function TableroLlamadosBox() {
  const classes = useStyles();
  // CANOSYS: concentra el contrato del backend y sus estados de carga en una sola vista.
  const [data, setData] = useState({
    resumen: { totalLlamados: 0, boxesLlamados: 0, operadores: 0, boxesEnPantalla: 0 },
    porBox: [],
    porOperador: [],
    porHora: [],
    ultimasLlamadas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CANOSYS: refresca el tablero sin alertas modales durante fallos transitorios de red.
  const cargarResumen = useCallback(async () => {
    try {
      const response = await axios.get("/informes/resumen-llamados-box", { suppressGlobalErrorAlert: true });
      if (response.status === 200 && response.data?.ok) {
        setData(response.data.result);
        setError("");
      }
    } catch (requestError) {
      console.error("Error al obtener el panel de llamados de BOXes", requestError);
      setError("No fue posible actualizar los llamados. Se intentará nuevamente en unos segundos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // CANOSYS: mantiene la información operativa actualizada cada quince segundos.
  useEffect(() => {
    cargarResumen();
    const intervalId = setInterval(cargarResumen, 15000);
    return () => clearInterval(intervalId);
  }, [cargarResumen]);

  // CANOSYS: asocia cada indicador con una semántica propia del sistema de box libre.
  const summaryItems = [
    { label: "Llamados de hoy", value: data.resumen.totalLlamados, color: "#8e44ad", icon: <NotificationsActiveIcon /> },
    { label: "BOXes que llamaron", value: data.resumen.boxesLlamados, color: "#2f8795", icon: <MeetingRoomIcon /> },
    { label: "Operadores activos", value: data.resumen.operadores, color: "#536d9f", icon: <PeopleIcon /> },
    { label: "BOXes en pantalla", value: data.resumen.boxesEnPantalla, color: "#d45a5a", icon: <TvIcon /> },
  ];

  // CANOSYS: prepara colores estables para la distribución por operador.
  const operatorChart = data.porOperador.map((item, index) => ({ ...item, color: chartColors[index % chartColors.length] }));

  if (loading) {
    return <Box className={classes.loadingState}><CircularProgress style={{ color: "#8e44ad" }} /></Box>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <PageHeader title="Panel de llamados de BOXes" subtitle="Actividad del día registrada por los operadores del llamador de box libre." />
        {error && <Box className={classes.errorState}>{error}</Box>}
      </Grid>

      {summaryItems.map((item) => (
        <Grid item xs={12} sm={6} lg={3} key={item.label}>
          <Card className={classes.summaryCard}>
            <CardContent className={classes.summaryContent}>
              <Avatar className={classes.summaryAvatar} style={{ backgroundColor: item.color }}>{item.icon}</Avatar>
              <Box minWidth={0}>
                <Typography className={classes.summaryLabel}>{item.label}</Typography>
                <Typography className={classes.summaryValue}>{item.value}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid item xs={12} lg={7}>
        <Card className={classes.panelCard}>
          <CardHeader className={classes.panelHeader} title="Llamados por BOX" subheader="Cantidad de avisos registrados hoy en cada punto de atención" />
          <CardContent className={classes.panelContent}>
            {data.porBox.length ? (
              <Box className={classes.chartArea}>
                <ResponsiveContainer>
                  <BarChart data={data.porBox} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
                    <XAxis dataKey="nombre" angle={-18} textAnchor="end" height={64} tick={{ fill: "#607486", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#607486", fontSize: 12 }} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Bar dataKey="cantidad" fill="#8e5aa8" radius={[7, 7, 0, 0]} maxBarSize={62} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : <Box className={classes.emptyState}>Todavía no se registraron llamados de BOXes hoy.</Box>}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Card className={classes.panelCard}>
          <CardHeader className={classes.panelHeader} title="Actividad por operador" subheader="Participación de los usuarios llamadores durante el día" />
          <CardContent className={classes.panelContent}>
            {operatorChart.length ? (
              <>
                <Box className={classes.chartArea}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={operatorChart} dataKey="cantidad" nameKey="nombre" innerRadius="52%" outerRadius="78%" paddingAngle={2}>
                        {operatorChart.map((item) => <Cell key={item.nombre} fill={item.color} />)}
                      </Pie>
                      <Tooltip content={<DashboardTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box className={classes.legend}>
                  {operatorChart.map((item) => (
                    <Box className={classes.legendItem} key={item.nombre}>
                      <span className={classes.legendDot} style={{ backgroundColor: item.color }} />
                      <span className={classes.legendLabel}>{item.nombre}</span>
                      <span className={classes.legendValue}>{item.cantidad}</span>
                    </Box>
                  ))}
                </Box>
              </>
            ) : <Box className={classes.emptyState}>No hay actividad de operadores registrada hoy.</Box>}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card className={classes.panelCard}>
          <CardHeader className={classes.panelHeader} title="Actividad por hora" subheader="Evolución de los llamados durante la jornada" />
          <CardContent className={classes.panelContent}>
            {data.porHora.length ? (
              <Box className={classes.chartArea}>
                <ResponsiveContainer>
                  <BarChart data={data.porHora} margin={{ top: 10, right: 15, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6ebef" />
                    <XAxis dataKey="hora" tick={{ fill: "#607486", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#607486", fontSize: 12 }} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Bar dataKey="cantidad" fill="#2f8795" radius={[7, 7, 0, 0]} maxBarSize={52} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : <Box className={classes.emptyState}>Aún no hay actividad horaria para mostrar.</Box>}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card className={classes.panelCard}>
          <CardHeader className={classes.panelHeader} title="Últimas llamadas" subheader="Los diez avisos más recientes registrados hoy" />
          <TableContainer className={classes.tableContainer}>
            <Table stickyHeader size="small" aria-label="Últimas llamadas de BOXes">
              <TableHead><TableRow className={classes.tableHead}>
                <TableCell className={classes.tableHeadCell}>BOX</TableCell>
                <TableCell className={classes.tableHeadCell}>Operador</TableCell>
                <TableCell className={classes.tableHeadCell}>Hora</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {data.ultimasLlamadas.length ? data.ultimasLlamadas.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className={classes.tableCell}><span className={classes.boxBadge}>{row.box}</span></TableCell>
                    <TableCell className={classes.tableCell}>{row.operador}</TableCell>
                    <TableCell className={classes.tableCell}>{row.hora}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={3} align="center" className={classes.tableCell}>Todavía no se registraron llamadas hoy.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}
