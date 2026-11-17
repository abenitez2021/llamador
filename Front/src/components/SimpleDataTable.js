import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

// CANOSYS: tabla ligera para reportes que no necesitan filtros ni paginación de Material Table.
const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    maxHeight: 460,
    overflowX: "auto",
  },
  empty: {
    padding: theme.spacing(4),
    color: "#6b7d8c",
    textAlign: "center",
  },
  numeric: {
    fontWeight: 700,
    color: "#24445f",
    whiteSpace: "nowrap",
  },
}));

// CANOSYS: mantiene una estructura y estado vacío uniformes en tablas MUI simples.
export default function SimpleDataTable({ columns, data, emptyMessage = "No hay registros para mostrar." }) {
  const classes = useStyles();
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    return <Typography className={classes.empty}>{emptyMessage}</Typography>;
  }

  return (
    <TableContainer className={classes.container}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.field} align={column.align || "left"}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow hover key={row.id || row.id_turno || rowIndex}>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || "left"}
                  className={column.align === "right" ? classes.numeric : undefined}
                >
                  {column.render ? column.render(row) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

