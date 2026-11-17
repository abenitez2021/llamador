import React, { useEffect, useState } from "react";
import {
  Grid,
  Button,
  TextField,
  Card,
  CardHeader,
} from "@material-ui/core";
import axios from "../../utils/axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Logo from "../../assets/images/logo-color.png";
import { ReportFilterPanel, ReportPageHeader } from "../../components/ReportLayout";
import SimpleDataTable from "../../components/SimpleDataTable";
import { getLocalDateInputValue } from "../../utils/date";

export default function InformeTiemposEspera() {
  // CANOSYS: muestra hoy desde el primer render y evita una consulta inicial con fechas vacías.
  const fechaHoy = getLocalDateInputValue();
  const [fechaDesde, setFechaDesde] = useState(fechaHoy);
  const [fechaHasta, setFechaHasta] = useState(fechaHoy);
  const [datos, setDatos] = useState([]);

  const buscar = async (desde = fechaDesde, hasta = fechaHasta) => {
    try {
      const res = await axios.post("/informes/informe-tiempos-espera", {
        fechaDesde: desde || "2000-01-01",
        fechaHasta: hasta || "2099-12-31",
      });

      if (res.data.ok) {
        setDatos(res.data.result);
      }
    } catch (error) {
      console.error("Error al cargar informe de tiempos de espera", error);
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
      datos.map((row) => ({
        Trámite: row.tramite,
        Punto: row.punto,
        Usuario: row.usuario,
        "Promedio (min)": parseFloat(row.tiempo_promedio).toFixed(1),
        "Máximo (min)": row.tiempo_maximo,
        "Mínimo (min)": row.tiempo_minimo,
      }))
    );
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Tiempos de Espera");
    const buffer = XLSX.write(libro, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "Informe_Tiempos_Espera.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const fechaActual = new Date().toISOString().split("T")[0];

    const addHeader = (doc) => {
      const imageWidth = 40;
      const imageHeight = 20;
      doc.setFillColor(70, 130, 180);
      doc.rect(55, 10, doc.internal.pageSize.getWidth(), 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("INFORME DE TIEMPOS DE ESPERA", 60, 23);
      doc.addImage(Logo, "PNG", 10, 10, imageWidth, imageHeight);
    };

    addHeader(doc);

    const tableData = datos.map((row) => [
      row.tramite,
      row.punto,
      row.usuario,
      parseFloat(row.tiempo_promedio).toFixed(1),
      row.tiempo_maximo,
      row.tiempo_minimo,
    ]);

    doc.autoTable({
      head: [["Trámite", "Punto", "Usuario", "Promedio (min)", "Máximo (min)", "Mínimo (min)"]],
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

    doc.save(`Tiempos_Espera_${fechaActual}.pdf`);
  };

  useEffect(() => {
    // CANOSYS: consulta exactamente el rango que queda visible en los controles.
    buscar(fechaHoy, fechaHoy);
  }, []);

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* CANOSYS: identifica la vista y explica el contenido del informe. */}
      <ReportPageHeader
        title="Tiempos de atención"
        subtitle="Consulta tiempos promedio, máximos y mínimos por trámite, punto y operador."
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader title="Informe de Tiempos de Espera por Trámite, Punto y Usuario" />
            {/* CANOSYS: reemplaza la tabla HTML anterior por la tabla ligera compartida. */}
            <SimpleDataTable
              data={datos}
              columns={[
                { field: "tramite", label: "Trámite" },
                { field: "punto", label: "Punto" },
                { field: "usuario", label: "Usuario" },
                { field: "tiempo_promedio", label: "Promedio (min)", align: "right", render: (row) => parseFloat(row.tiempo_promedio).toFixed(1) },
                { field: "tiempo_maximo", label: "Máximo (min)", align: "right" },
                { field: "tiempo_minimo", label: "Mínimo (min)", align: "right" },
              ]}
            />
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
