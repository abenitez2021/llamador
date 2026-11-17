import React, { useEffect, useState } from "react";
import {
  Grid,
  Button,
  TextField,
} from "@material-ui/core";
import axios from "../../utils/axios";
// CANOSYS: código anterior conservado como referencia.
// import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Logo from "../../assets/images/logo-color.png";
import { ReportFilterPanel, ReportPageHeader } from "../../components/ReportLayout";
import ReportDistributionPanels from "../../components/ReportDistributionPanels";
import { getLocalDateInputValue } from "../../utils/date";

export default function InformeGraficoTramites() {
  // CANOSYS: muestra hoy desde el primer render y evita una consulta inicial con fechas vacías.
  const fechaHoy = getLocalDateInputValue();
  const [fechaDesde, setFechaDesde] = useState(fechaHoy);
  const [fechaHasta, setFechaHasta] = useState(fechaHoy);
  const [datos, setDatos] = useState([]);

  // CANOSYS: código anterior conservado como referencia; generaba colores distintos en cada búsqueda.
  // const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  const buscar = async (desde = fechaDesde, hasta = fechaHasta) => {
    try {
      const res = await axios.post("/informes/grafico-tramites", {
        fechaDesde: desde || "2000-01-01",
        fechaHasta: hasta || "2099-12-31",
      });

      if (res.data.ok) {
        const dataTransformada = res.data.result.map((item) => ({
          name: item.tramite,
          value: parseInt(item.cantidad),
        }));
        setDatos(dataTransformada);
      }
    } catch (error) {
      console.error("Error al cargar gráfico de trámites", error);
    }
  };

  const limpiarFiltros = () => {
    const hoyLocal = getLocalDateInputValue();
    setFechaDesde(hoyLocal);
    setFechaHasta(hoyLocal);
    setDatos([]);
  };

  const exportarExcel = () => {
    const hoja = XLSX.utils.json_to_sheet(
      datos.map(({ name, value }) => ({ Trámite: name, Cantidad: value }))
    );
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Trámites Atenciones");
    const buffer = XLSX.write(libro, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "Tramites_Atencion.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const fechaActual = new Date().toISOString().split("T")[0];

    const addHeader = (doc) => {
      const imageWidth = 40;
      const imageHeight = 20;
      const textBackgroundY = 10;
      const textBackgroundHeight = 20;

      doc.setFillColor(70, 130, 180);
      doc.rect(55, textBackgroundY, doc.internal.pageSize.getWidth(), textBackgroundHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("INFORME DE ATENCIONES POR TRÁMITE", 60, 23);
      doc.addImage(Logo, "PNG", 10, 10, imageWidth, imageHeight);
    };

    addHeader(doc);

    const tableData = datos.map(({ name, value }) => [name, value]);

    doc.autoTable({
      head: [["Trámite", "Cantidad"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      styles: { lineColor: [0, 0, 0], cellPadding: 2 },
      headStyles: { fillColor: [70, 130, 180], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageNumberString = `Página ${i} de ${totalPages}`;
      const printedDateString = `Fecha de impresión: ${new Date().toLocaleString()}`;
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(pageNumberString, 10, doc.internal.pageSize.getHeight() - 10);
      doc.text(printedDateString, 10, doc.internal.pageSize.getHeight() - 5);
    }

    doc.save(`Tramites_Atencion_${fechaActual}.pdf`);
  };

  useEffect(() => {
    // CANOSYS: consulta exactamente el rango que queda visible en los controles.
    buscar(fechaHoy, fechaHoy);
  }, []);

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* CANOSYS: identifica la vista y explica el contenido del informe. */}
      <ReportPageHeader
        title="Atenciones por trámite"
        subtitle="Analiza la demanda y distribución de atenciones entre los trámites disponibles."
      />
      <ReportFilterPanel>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            variant="outlined"
            size="small"
            label="Fecha Desde"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            variant="outlined"
            size="small"
            label="Fecha Hasta"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button variant="contained" color="primary" onClick={() => buscar()} fullWidth>
            Buscar
          </Button>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button variant="outlined" onClick={limpiarFiltros} fullWidth>
            Limpiar
          </Button>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button variant="contained" onClick={exportarExcel} fullWidth style={{ backgroundColor: "#2e7d32", color: "#fff" }}>
            Excel
          </Button>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button variant="contained" onClick={exportarPDF} fullWidth style={{ backgroundColor: "#c62828", color: "#fff" }}>
            PDF
          </Button>
        </Grid>
      </Grid>
      </ReportFilterPanel>

      {/* CANOSYS: el gráfico circular, la leyenda y la tabla HTML anteriores se reemplazan
          por una composición responsive compartida, sin modificar los datos del informe. */}
      <ReportDistributionPanels
        data={datos}
        dimensionLabel="Trámite"
        chartTitle="Distribución de atenciones por trámite"
        detailTitle="Detalle por trámite"
      />
    </div>
  );
}
