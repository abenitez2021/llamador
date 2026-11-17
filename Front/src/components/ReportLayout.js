import React from "react";
import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PageHeader from "./PageHeader";

// CANOSYS: estilos compartidos por las páginas de informes y sus filtros.
const useStyles = makeStyles(() => ({
  // CANOSYS: código anterior conservado como referencia; la cabecera ahora usa PageHeader.
  // header: { marginBottom: 20 },
  // title: { color: "#ffffff", fontWeight: 700, letterSpacing: "0.025em" },
  // subtitle: { color: "rgba(255, 255, 255, 0.78)", marginTop: 4 },
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
    "& .MuiButton-root": {
      minHeight: 40,
      fontWeight: 700,
    },
    "& .MuiButton-containedPrimary": {
      backgroundColor: "#087f8c",
      color: "#ffffff",
    },
  },
  filterTitle: {
    color: "#24445f",
    fontWeight: 700,
    marginBottom: 14,
  },
}));

// CANOSYS: cabecera uniforme para identificar cada vista de informes.
export function ReportPageHeader({ title, subtitle }) {
  // CANOSYS: unifica informes, registros y administración con la cabecera global.
  return <PageHeader title={title} subtitle={subtitle} />;
}

// CANOSYS: superficie reutilizable para filtros y acciones.
export function ReportFilterPanel({ children }) {
  const classes = useStyles();
  return (
    <Paper elevation={3} className={classes.filterPanel}>
      <Typography variant="subtitle1" className={classes.filterTitle}>
        Filtros del informe
      </Typography>
      {children}
    </Paper>
  );
}

