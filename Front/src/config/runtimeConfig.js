// CANOSYS: conserva la URL histórica como respaldo para el servidor separado de desarrollo.
const legacyApiBaseUrl =
  `${process.env.REACT_APP_API_PROTOCOL || ""}://${process.env.REACT_APP_API_HOST || ""}`;

// CANOSYS: elimina barras sobrantes para formar endpoints uniformes.
const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, "");

// CANOSYS: en producción usa el mismo servidor que entregó React; en desarrollo conserva las variables anteriores.
export function getApiBaseUrl() {
  const useSameOrigin = process.env.NODE_ENV === "production";
  const apiOrigin = useSameOrigin
    ? window.location.origin
    : legacyApiBaseUrl.replace(/\/+$/, "");

  return `${apiOrigin}/api/`;
}

// CANOSYS: construye URLs para módulos que no utilizan la instancia Axios compartida.
export function getApiUrl(path = "") {
  return `${getApiBaseUrl()}${trimSlashes(path)}`;
}
