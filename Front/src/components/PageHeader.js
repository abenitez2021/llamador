import React from "react";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

// CANOSYS: replica la jerarquía visual reutilizable de títulos de ENTER_TURNERO.
const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    marginBottom: theme.spacing(2.5),
    paddingLeft: theme.spacing(2),
    minWidth: 0,
    "&::before": {
      content: '""',
      position: "absolute",
      top: 2,
      bottom: 2,
      left: 0,
      width: 4,
      borderRadius: 4,
      backgroundColor: "#22c0c3",
    },
  },
  title: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "1.5rem",
    lineHeight: 1.2,
    letterSpacing: "0.015em",
    textShadow: "0 1px 2px rgba(24, 42, 82, 0.24)",
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.25rem",
    },
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: theme.spacing(0.5),
    lineHeight: 1.5,
    maxWidth: 760,
  },
}));

// CANOSYS: identifica cada sección interna sin intervenir en su comportamiento.
export default function PageHeader({ title, subtitle }) {
  const classes = useStyles();

  return (
    <header className={classes.root}>
      <Typography component="h1" className={classes.title}>
        {title}
      </Typography>
      {subtitle && (
        <Typography component="p" variant="body2" className={classes.subtitle}>
          {subtitle}
        </Typography>
      )}
    </header>
  );
}
