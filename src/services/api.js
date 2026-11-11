import axios from 'axios';
import {
  EVENTO_SESION_EXPIRADA,
  borrarSesionGuardada,
  obtenerToken,
} from './sesion';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Agrega el token de la sesión a cada pedido.
api.interceptors.request.use((config) => {
  const token = obtenerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el servidor rechaza el token (vencido, contraseña cambiada, etc.),
// se cierra la sesión local y las rutas protegidas redirigen al login.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const teniaToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && teniaToken) {
      borrarSesionGuardada();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  },
);

export default api;
