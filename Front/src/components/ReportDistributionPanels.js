import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// CANOSYS: paleta determinística con contraste consistente para todos los reportes.
const chartColors = [
  "#536d9f",
  "#8e5aa8",
  "#2f8795",
  "#d17b5f",
  "#6f8f58",
  "#c15d78",
  "#607d8b",
  "#b58b3e",
];

// CANOSYS: estilos comunes para gráficos, leyendas y tablas de detalle.
const useStyles = makeStyles((theme) => ({
  panel: {
    height: "100%",
    borderRadius: 14,
    border: "1px solid rgba(36, 68, 95, 0.12)",
    boxShadow: "0 8px 24px rgba(28, 48, 74, 0.10)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: theme.spacing(2, 2.5),
    borderBottom: "1px solid #e7ecf0",
    "& .MuiCardHeader-title": {
      color: "#24445f",
      fontWeight: 700,
      fontSize: "1.05rem",
    },
  },
  chartContent: {
    padding: theme.spacing(2),
    "&:last-child": {
      paddingBottom: theme.spacing(2),
    },
  },
  chart: {
    width: "100%",
    height: 280,
  },
  legend: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
    },
  },
  legendItem: {
    display: "flex",
    alignItems: "flex-start",
    minWidth: 0,
    padding: theme.spacing(0.75, 1),
    borderRadius: 8,
    backgroundColor: "#f7f9fb",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 5,
    marginRight: theme.spacing(1),
  },
  legendLabel: {
    flex: 1,
    minWidth: 0,
    color: "#40566a",
    fontSize: "0.8rem",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },
  legendValue: {
    marginLeft: theme.spacing(1),
    color: "#24445f",
    fontWeight: 700,
  },
  tableContainer: {
    maxHeight: 430,
  },
  quantity: {
    width: 100,
    textAlign: "right",
    fontWeight: 700,
    color: "#24445f",
  },
  empty: {
    minHeight: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7d8c",
    textAlign: "center",
    padding: theme.spacing(3),
  },
}));

// CANOSYS: tooltip compacto que evita repetir la leyenda dentro del gráfico.
function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <Box
      bgcolor="#ffffff"
      border="1px solid #dce4ea"
      borderRadius={8}
      boxShadow="0 6px 18px rgba(28, 48, 74, 0.14)"
      p={1.25}
      maxWidth={260}
    >
      <Typography variant="body2" style={{ color: "#40566a" }}>
        {item.name}
      </Typography>
      <Typography variant="subtitle2" style={{ color: "#24445f", fontWeight: 700 }}>
        Cantidad: {item.value}
      </Typography>
    </Box>
  );
}

// CANOSYS: composición responsive compartida para distribución y detalle de reportes.
export default function ReportDistributionPanels({
  data,
  dimensionLabel,
  chartTitle,
  detailTitle,
}) {
  const classes = useStyles();
  const safeData = Array.isArray(data) ? data : [];

  return (
    <Grid container spacing={3} alignItems="stretch">
      <Grid item xs={12} lg={6}>
        <Card className={classes.panel}>
          <CardHeader className={classes.cardHeader} title={chartTitle} />
          <CardContent className={classes.chartContent}>
            {safeData.length ? (
              <>
                <div className={classes.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={safeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="48%"
                        outerRadius="76%"
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {safeData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<DistributionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={classes.legend}>
                  {safeData.map((entry, index) => (
                    <div className={classes.legendItem} key={`${entry.name}-legend-${index}`}>
                      <span
                        className={classes.colorDot}
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className={classes.legendLabel}>{entry.name}</span>
                      <span className={classes.legendValue}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={classes.empty}>
                No hay datos para el período seleccionado.
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Card className={classes.panel}>
          <CardHeader className={classes.cardHeader} title={detailTitle} />
          {safeData.length ? (
            <TableContainer className={classes.tableContainer}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{dimensionLabel}</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeData.map((row, index) => (
                    <TableRow key={`${row.name}-row-${index}`} hover>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right" className={classes.quantity}>
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <div className={classes.empty}>
              No hay registros para mostrar.
            </div>
          )}
        </Card>
      </Grid>
    </Grid>
  );
}

