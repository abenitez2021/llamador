import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Grid, MenuItem, Paper, TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "../../utils/axios";
import Logo from "../../assets/images/logo-color.png";
import { ReportFilterPanel, ReportPageHeader } from "../../components/ReportLayout";
import SimpleDataTable from "../../components/SimpleDataTable";
import { getLocalDateInputValue } from "../../utils/date";

// CANOSYS: aplica una superficie consistente con los reportes modernizados de ENTER_TURNERO.
const useStyles = makeStyles((theme) => ({
  resultCard: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(36, 68, 95, 0.12)",
    boxShadow: "0 10px 26px rgba(28, 48, 74, 0.12)",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2, 2.5),
    borderBottom: "1px solid #e7ecf0",
    backgroundColor: "#ffffff",
  },
  resultTitle: { color: "#24445f", fontWeight: 800 },
  resultCount: { color: "#5b6f80", fontWeight: 600, whiteSpace: "nowrap" },
  error: { color: "#a32424", fontWeight: 600, marginTop: theme.spacing(1) },
}));

// CANOSYS: define columnas estables para pantalla y exportaciones.
const columns = [
  { field: "fecha", label: "Fecha" },
  { field: "hora", label: "Hora" },
  { field: "box", label: "BOX" },
  { field: "operador", label: "Operador" },
];

// CANOSYS: reporta el historial persistido sin utilizar datos del turnero tradicional.
export default function InformeLlamadosBox() {
  const classes = useStyles();
  const hoy = getLocalDateInputValue();
  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [idPunto, setIdPunto] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [datos, setDatos] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  // CANOSYS: consulta rangos inclusivos y conserva exactamente los filtros visibles.
  const buscar = useCallback(async (filtrosIniciales) => {
    const desde = filtrosIniciales?.fechaDesde || fechaDesde;
    const hasta = filtrosIniciales?.fechaHasta || fechaHasta;
    if (!desde || !hasta || desde > hasta) {
      setError("La fecha desde no puede ser posterior a la fecha hasta.");
      return;
    }

    setBuscando(true);
    try {
      const response = await axios.post("/informes/historial-llamados-box", {
        fechaDesde: desde,
        fechaHasta: hasta,
        idPunto: filtrosIniciales ? "" : idPunto,
        idUsuario: filtrosIniciales ? "" : idUsuario,
      });
      if (response.data?.ok) {
        setDatos(response.data.result || []);
        setBoxes(response.data.filtros?.boxes || []);
        setOperadores(response.data.filtros?.operadores || []);
        setError("");
      }
    } catch (requestError) {
      console.error("Error al consultar historial de llamados", requestError);
      setError("No fue posible consultar el reporte.");
    } finally {
      setBuscando(false);
    }
  }, [fechaDesde, fechaHasta, idPunto, idUsuario]);

  // CANOSYS: carga el día actual al abrir el reporte.
  useEffect(() => {
    buscar({ fechaDesde: hoy, fechaHasta: hoy });
  }, []);

  // CANOSYS: restablece fechas y selecciones antes de repetir la consulta del día.
  const limpiar = () => {
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    setIdPunto("");
    setIdUsuario("");
    buscar({ fechaDesde: hoy, fechaHasta: hoy });
  };

  // CANOSYS: exporta exactamente las filas filtradas que se ven en pantalla.
  const exportarExcel = () => {
    const rows = datos.map((row) => ({ Fecha: row.fecha, Hora: row.hora, BOX: row.box, Operador: row.operador }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Llamados BOXes");
    const buffer = XLSX.write(book, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), `Llamados_BOXes_${fechaDesde}_${fechaHasta}.xlsx`);
  };

  // CANOSYS: genera un PDF institucional con el mismo resultado filtrado.
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    doc.addImage(Logo, "PNG", 10, 9, 38, 19);
    doc.setFillColor(83, 109, 159);
    doc.rect(53, 9, 147, 19, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text("HISTORIAL DE LLAMADOS DE BOXES", 59, 21);
    doc.autoTable({
      head: [["Fecha", "Hora", "BOX", "Operador"]],
      body: datos.map((row) => [row.fecha, row.hora, row.box, row.operador]),
      startY: 36,
      theme: "grid",
      headStyles: { fillColor: [83, 109, 159], textColor: 255 },
    });
    doc.save(`Llamados_BOXes_${fechaDesde}_${fechaHasta}.pdf`);
  };

  return (
    <div>
      <ReportPageHeader title="Historial de llamados de BOXes" subtitle="Consulta llamadas registradas por fecha, punto de atención y operador." />
      <ReportFilterPanel>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField variant="outlined" size="small" label="Fecha desde" type="date" fullWidth InputLabelProps={{ shrink: true }} value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField variant="outlined" size="small" label="Fecha hasta" type="date" fullWidth InputLabelProps={{ shrink: true }} value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField select variant="outlined" size="small" label="BOX" fullWidth value={idPunto} onChange={(event) => setIdPunto(event.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {boxes.map((box) => <MenuItem key={box.id} value={box.id}>{box.nombre}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField select variant="outlined" size="small" label="Operador" fullWidth value={idUsuario} onChange={(event) => setIdUsuario(event.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {operadores.map((operador) => <MenuItem key={operador.id} value={operador.id}>{operador.nombre}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={1}><Button variant="contained" color="primary" fullWidth disabled={buscando} onClick={() => buscar()}>Buscar</Button></Grid>
          <Grid item xs={6} sm={3} md={1}><Button variant="outlined" fullWidth disabled={buscando} onClick={limpiar}>Limpiar</Button></Grid>
          <Grid item xs={6} sm={3} md={1}><Button variant="contained" fullWidth disabled={!datos.length} onClick={exportarExcel} style={{ backgroundColor: "#2e7d32", color: "#fff" }}>Excel</Button></Grid>
          <Grid item xs={6} sm={3} md={1}><Button variant="contained" fullWidth disabled={!datos.length} onClick={exportarPDF} style={{ backgroundColor: "#c62828", color: "#fff" }}>PDF</Button></Grid>
        </Grid>
        {error && <Typography className={classes.error}>{error}</Typography>}
      </ReportFilterPanel>

      <Paper className={classes.resultCard}>
        <Box className={classes.resultHeader}>
          <Typography className={classes.resultTitle}>Detalle de llamadas</Typography>
          <Typography className={classes.resultCount}>{datos.length} registro{datos.length === 1 ? "" : "s"}</Typography>
        </Box>
        <SimpleDataTable columns={columns} data={datos} emptyMessage="No existen llamados para los filtros seleccionados." />
      </Paper>
    </div>
  );
}
