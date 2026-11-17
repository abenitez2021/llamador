import React from "react";
import MaterialTable from "material-table";
import { makeStyles } from "@material-ui/core/styles";

// CANOSYS: lenguaje visual compartido para todas las instancias de Material Table.
const useStyles = makeStyles((theme) => ({
  surface: {
    width: "100%",
    minWidth: 0,
    "& > .MuiPaper-root": {
      overflow: "hidden",
      borderRadius: 14,
      border: "1px solid rgba(36, 68, 95, 0.12)",
      boxShadow: "0 8px 24px rgba(28, 48, 74, 0.10)",
      backgroundColor: "#ffffff",
    },
    "& .MuiToolbar-root": {
      minHeight: 64,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      borderBottom: "1px solid #e6ebf0",
      backgroundColor: "#ffffff",
    },
    "& .MuiToolbar-root .MuiTypography-h6": {
      color: "#24445f",
      fontWeight: 700,
      fontSize: "1.05rem",
    },
    "& .MuiTableCell-head": {
      backgroundColor: "#eef3f7 !important",
      color: "#24445f !important",
      fontWeight: "700 !important",
      fontSize: "0.82rem",
      letterSpacing: "0.018em",
      lineHeight: 1.35,
      borderBottom: "1px solid #d5dee6",
    },
    "& .MuiTableCell-body": {
      color: "#26394a",
      fontSize: "0.9rem",
      lineHeight: 1.45,
      borderBottom: "1px solid #e8edf1",
    },
    "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
      backgroundColor: "#fafcfd",
    },
    "& .MuiTableBody-root .MuiTableRow-root:hover": {
      backgroundColor: "#f0f6f8 !important",
    },
    "& .MuiTableRow-root.Mui-selected": {
      backgroundColor: "rgba(34, 192, 195, 0.10) !important",
    },
    "& .MuiTableCell-paddingNone": {
      padding: theme.spacing(1, 1.25),
    },
    "& .MuiInput-underline:before": {
      borderBottomColor: "#b8c5d0",
    },
    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
      borderBottomColor: "#6d8192",
    },
    "& .MuiTablePagination-toolbar": {
      minHeight: 56,
      backgroundColor: "#f8fafb",
      borderTop: "1px solid #e6ebf0",
    },
    "& .MuiIconButton-root": {
      color: "#48677f",
    },
    "& .MuiIconButton-root:hover": {
      backgroundColor: "rgba(21, 117, 146, 0.08)",
    },
    [theme.breakpoints.down("sm")]: {
      "& .MuiToolbar-root": {
        minHeight: 56,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      },
      "& .MuiTableCell-head, & .MuiTableCell-body": {
        padding: theme.spacing(1),
      },
    },
  },
}));

// CANOSYS: combina opciones visuales modernas sin reemplazar opciones funcionales de cada tabla.
export function getModernTableOptions(options = {}) {
  // CANOSYS: conserva propiedades útiles como posición sticky, descartando colores aislados heredados.
  const remainingHeaderStyle = { ...(options.headerStyle || {}) };
  // CANOSYS: código anterior conservado como referencia visual en options.headerStyle.
  delete remainingHeaderStyle.backgroundColor;
  delete remainingHeaderStyle.color;

  return {
    ...options,
    headerStyle: {
      ...remainingHeaderStyle,
      backgroundColor: "#eef3f7",
      color: "#24445f",
      fontWeight: 700,
    },
  };
}

// CANOSYS: wrapper único para unificar tablas sin modificar columnas, acciones ni datos.
export default function ModernMaterialTable({ options, ...props }) {
  const classes = useStyles();

  return (
    <div className={classes.surface}>
      <MaterialTable {...props} options={getModernTableOptions(options)} />
    </div>
  );
}

