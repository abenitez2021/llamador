import React, { useEffect, useState } from "react";
// CANOSYS: código anterior conservado como referencia.
// import MaterialTable from "material-table";
import ModernMaterialTable from "../../components/MaterialTables/ModernMaterialTable";
import axios from "../../utils/axios";
import { Grid, Button, TextField, MenuItem, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { alertWarningError } from "../../components/Notificaciones";

import { forwardRef } from "react";
import {
  AddBox, ArrowDownward, Check, ChevronLeft, ChevronRight,
  Clear, DeleteOutline, Edit, FilterList, FirstPage, LastPage,
  Remove, SaveAlt, Search, ViewColumn
} from "@material-ui/icons";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
import "jspdf-autotable";

import Logo from "../../assets/images/logo-color.png"; // Cambiá la ruta si es necesario
import { ReportPageHeader } from "../../components/ReportLayout";
import { getLocalDateInputValue } from "../../utils/date";



const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
};

// CANOSYS: estilos de filtros legibles y consistentes sobre el fondo degradado.
const useReportStyles = makeStyles(() => ({
  filterPanel: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(49, 80, 111, 0.12)",
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#ffffff",
      color: "#172b3a",
    },
    "& .MuiInputLabel-root": {
      color: "#31506f",
      fontWeight: 600,
    },
  },
}));


export default function InformeMovimientos() {
  // CANOSYS: aplica el panel visual únicamente a este informe.
  const reportClasses = useReportStyles();
  const [datos, setDatos] = useState([]);
  const [tramites, setTramites] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [puntos, setPuntos] = useState([]);

  const [estadoFiltro, setEstadoFiltro] = useState("");

  // CANOSYS: Movimientos inicia con el mismo rango de hoy que los demás informes.
  const fechaHoy = getLocalDateInputValue();
  const [filtros, setFiltros] = useState({
    fechaDesde: fechaHoy,
    fechaHasta: fechaHoy,
    idTramite: "",
    idBox: "",
    idUsuario: "",
    estado: "",
  });

  const limpiarFiltros = () => {
    setFiltros({
      // CANOSYS: limpiar restablece el rango operativo predeterminado de hoy.
      fechaDesde: fechaHoy,
      fechaHasta: fechaHoy,
      idTramite: "",
      idBox: "",
      idUsuario: "",
      estado: "",

    });
    setEstadoFiltro("");
    setDatos([]); // limpiar tabla
  };

  const columnas = [
    {
      title: "Nro.",
      render: (rowData) => datosFiltrados.indexOf(rowData) + 1,
      export: true,
    },
    { title: "Código", field: "codigo_turno" },
    { title: "Visitante", field: "visitante" },
    { title: "Documento", field: "nro_documento" },
    { title: "Trámite", field: "tramite" },
    { title: "Punto Atención", field: "punto" },
    { title: "Usuario", field: "usuario" },
    { title: "Estado", field: "estado" },
    { title: "Emisión", field: "fecha_emision", type: "datetime" },
    { title: "Llamado", field: "fecha_llamado", type: "datetime" },
    { title: "Finalización", field: "fecha_finalizacion", type: "datetime" },
  ];

  const cargarDatos = async (filtrosConsulta = filtros) => {
    try {
      const filtrosAEnviar = {
        fechaDesde: filtrosConsulta.fechaDesde || "2000-01-01",
        fechaHasta: filtrosConsulta.fechaHasta || "2099-12-31",
        idTramite: filtrosConsulta.idTramite || null,
        idBox: filtrosConsulta.idBox || null,
        idUsuario: filtrosConsulta.idUsuario || null,
      };


      const res = await axios.post("/informes/informe-movimientos", filtrosAEnviar);
      setDatos(res.data?.result || []);
    } catch (error) {
      console.error("Error al cargar datos", error);
      alertWarningError(error?.response);
    }
  };
  const datosFiltrados = filtros.estado
    ? datos.filter((d) => d.estado === filtros.estado)
    : datos;

  const cargarCombos = async () => {
    try {
      const [tramitesRes, puntosRes, usuariosRes] = await Promise.all([
        axios.get("/tramites/listar"),
        axios.get("/puntoatencion/listar"),
        axios.post("/usuarios/listar", {}),
      ]);

      //setTramites(tramitesRes.data.result || []);
      //setPuntos(puntosRes.data.result || []);
      setTramites(tramitesRes.data || []);
      setPuntos(puntosRes.data || []);

      // Solo roles 3 y 5 Hasta aqui 
      const filtrados = (usuariosRes.data?.result || []).filter(
        (u) => u.idRol === 3 || u.idRol === 5
      );
      setUsuarios(filtrados);
    } catch (error) {
      console.error("Error al cargar combos", error);
      alertWarningError(error?.response);
    }
  };
  const exportarExcel = () => {
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Informe");
    const buffer = XLSX.write(libro, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "InformeMovimientos.xlsx");
  };


  const handleExportPDF = () => {
    console.log("esto en foto", Logo)

    const doc = new jsPDF({ orientation: "landscape" });

    const fechaActual = new Date().toISOString().slice(0, 10);

    const addHeader = (doc) => {
      const imageWidth = 40;
      const imageHeight = 20;
      const textBackgroundHeight = 20;
      const textBackgroundX = 55;
      const textBackgroundY = 10;
      const textBackgroundWidth = doc.internal.pageSize.getWidth();
      const imageX = 10;
      const imageY = 10;

      doc.setFillColor(70, 130, 180); // Violeta
      doc.rect(textBackgroundX, textBackgroundY, textBackgroundWidth, textBackgroundHeight, "F");
      doc.setTextColor(255, 255, 255); // Blanco
      doc.setFontSize(16);

      const textX = 60;
      const textY = textBackgroundY + textBackgroundHeight / 2 + 6;
      doc.text("INFORME DE MOVIMIENTOS", textX, textY);

      doc.addImage(Logo, "PNG", imageX, imageY, imageWidth, imageHeight);
    };

    const totalRows = datosFiltrados.length;
    const rowsPerPage = 25;
    let currentPage = 1;
    let startIndex = 0;

    const tableHeader = [
      "Código", "Visitante", "Documento", "Trámite",
      "Punto Atención", "Usuario", "Estado",
      "Emisión", "Llamado", "Finalización"
    ];

    const tableStyles = {
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      cellPadding: 2,
    };

    const headerStyles = {
      fillColor: [70, 130, 180],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    };

    while (startIndex < totalRows || currentPage === 1) {
      if (currentPage > 1) {
        doc.addPage();
      }

      addHeader(doc);

      const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
      const tableData = [];
      for (let i = startIndex; i < endIndex; i++) {
        const row = datosFiltrados[i];
        if (row) {
          tableData.push([
            row.codigo_turno || "",
            row.visitante || "",
            row.nro_documento || "",
            row.tramite || "",
            row.punto || "",
            row.usuario || "",
            row.estado || "",
            row.fecha_emision || "",
            row.fecha_llamado || "",
            row.fecha_finalizacion || "",
          ]);
        } else {
          tableData.push(["", "", "", "", "", "", "", "", "", ""]);
        }
      }

      doc.autoTable({
        head: [tableHeader],
        body: tableData,
        startY: 40,
        theme: "grid",
        styles: tableStyles,
        headStyles: headerStyles,
      });

      startIndex += rowsPerPage;
      currentPage++;

      doc.setPage(currentPage);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(
        10,
        doc.internal.pageSize.getHeight() - 20,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 20
      );
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageNumberString = `Página ${i} de ${totalPages}`;
      const printedDateString = `Fecha de impresión: ${new Date().toLocaleString()}`;
      const footerX = 10;
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(pageNumberString, footerX, footerY - 5);
      doc.text(printedDateString, footerX, footerY);
    }

    const nombreArchivo = `MOVIMIENTOS-DE-TURNOS-${fechaActual}.pdf`;
    doc.save(nombreArchivo);
  };









  useEffect(() => {
    cargarCombos();
    // CANOSYS: carga de inmediato los movimientos del rango visible, sin depender de un estado asíncrono anterior.
    cargarDatos({
      fechaDesde: fechaHoy,
      fechaHasta: fechaHoy,
      idTramite: "",
      idBox: "",
      idUsuario: "",
    });
  }, []);



  return (
    <div style={{ maxWidth: "100%" }}>
      {/* CANOSYS: cabecera descriptiva alineada con los demás informes. */}
      <ReportPageHeader
        title="Movimientos de atención"
        subtitle="Consulta el historial operativo de turnos, llamados, estados y finalizaciones."
      />
      {/* CANOSYS: agrupa criterios y acciones en una superficie clara. */}
      <Paper elevation={3} className={reportClasses.filterPanel}>
        <Typography
          variant="subtitle1"
          style={{ color: "#24445f", fontWeight: 700, marginBottom: 14 }}
        >
          Filtros del informe
        </Typography>
      <Grid container spacing={2}>
        {/* CANOSYS: en anchos intermedios amplía la fecha para que el año no quede bajo el ícono. */}
        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            type="date"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
          />
        </Grid>
        {/* CANOSYS: conserva seis columnas en escritorio y hace legible la fecha en equipos compactos. */}
        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            type="date"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
          />
        </Grid>

        {/* CANOSYS: los selectores se reacomodan sin modificar sus valores ni filtros. */}
        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            select
            fullWidth
            label="Trámite"
            InputLabelProps={{ shrink: true }}
            value={filtros.idTramite}
            onChange={(e) => setFiltros({ ...filtros, idTramite: e.target.value })}
          >
            <MenuItem value="">Todos</MenuItem>
            {tramites.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.nombre}
              </MenuItem>
            ))}

          </TextField>
        </Grid>

        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            select
            fullWidth
            label="Punto"
            InputLabelProps={{ shrink: true }}
            value={filtros.idBox}
            onChange={(e) => setFiltros({ ...filtros, idBox: e.target.value })}
          >
            <MenuItem value="">Todos</MenuItem>
            {puntos.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.nombre}
              </MenuItem>
            ))}

          </TextField>
        </Grid>

        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            select
            fullWidth
            label="Usuario"
            InputLabelProps={{ shrink: true }}
            value={filtros.idUsuario}
            onChange={(e) => setFiltros({ ...filtros, idUsuario: e.target.value })}
          >
            <MenuItem value="">Todos</MenuItem>
            {usuarios.map((u) => (
              <MenuItem key={u.idUsuario} value={String(u.idUsuario)}>
                {u.nombre}{" "} {u.apellido}
              </MenuItem>
            ))}
          </TextField>


        </Grid>

        <Grid item xs={12} sm={4} md={2}>
          <TextField
            variant="outlined"
            size="small"
            select
            fullWidth
            label="Estado"
            InputLabelProps={{ shrink: true }}
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="ATENDIENDO">Atendiendo</MenuItem>
            <MenuItem value="FINALIZADO">Finalizado</MenuItem>
            <MenuItem value="REASIGNADO">Reasignado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </TextField>
        </Grid>


        {/* CANOSYS: mantiene visibles las cuatro acciones en resoluciones intermedias. */}
        <Grid item xs={12} sm={3} md={2}>
          <Button
            variant="contained"
            onClick={() => cargarDatos()}
            fullWidth
            style={{ backgroundColor: "#087f8c", color: "#fff", fontWeight: 700 }}
          >
            Buscar
          </Button>
        </Grid>
        <Grid item xs={12} sm={3} md={2}>
          {/* CANOSYS: acción secundaria con menor peso visual. */}
          <Button
            variant="outlined"
            onClick={limpiarFiltros}
            fullWidth
            style={{ borderColor: "#607d8b", color: "#455a64", fontWeight: 700 }}
          >
            Limpiar
          </Button>
        </Grid>
        <Grid item xs={12} sm={3} md={2}>
          {/* CANOSYS: exportación Excel identificada con verde. */}
          <Button
            variant="contained"
            onClick={exportarExcel}
            fullWidth
            style={{ backgroundColor: "#2e7d32", color: "#fff", fontWeight: 700 }}
          >
            Exportar Excel
          </Button>
        </Grid>
        <Grid item xs={12} sm={3} md={2}>
          {/* CANOSYS: exportación PDF identificada con rojo. */}
          <Button
            variant="contained"
            onClick={handleExportPDF}
            fullWidth
            style={{ backgroundColor: "#c62828", color: "#fff", fontWeight: 700 }}
          >
            Exportar PDF
          </Button>

        </Grid>

      </Grid>
      </Paper>

      <ModernMaterialTable
        title="Informe de Movimientos"
        columns={columnas}
        data={datosFiltrados} // después lo explico abajo
        icons={tableIcons}
        options={{
          exportButton: true,
          pageSize: 10,
          paging: true,
          emptyRowsWhenPaging: false,
        }}
      />

    </div>
  );
}
