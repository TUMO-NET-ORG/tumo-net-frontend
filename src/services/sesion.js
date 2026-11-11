const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

export const EVENTO_SESION_EXPIRADA = 'tumonet:sesion-expirada';

export function obtenerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function borrarSesionGuardada() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  } catch {
    // sin acceso a localStorage: no hay nada que borrar
  }
}
