import api from './api';

export async function login(email, password) {
  const respuesta = await api.post('/api/v1/auth/login', { email, password });
  return respuesta.data;
}

export async function logout() {
  await api.post('/api/v1/auth/logout');
}

export async function cambiarPassword(passwordActual, nuevaPassword) {
  const respuesta = await api.post('/api/v1/auth/change-password', {
    passwordActual,
    nuevaPassword,
  });
  return respuesta.data;
}

export async function obtenerSesion() {
  const respuesta = await api.get('/api/v1/auth/me');
  return respuesta.data;
}

export async function solicitarRecuperacion(email) {
  const respuesta = await api.post('/api/v1/auth/forgot-password', { email });
  return respuesta.data;
}

export async function restablecerPassword(token, nuevaPassword) {
  const respuesta = await api.post('/api/v1/auth/reset-password', { token, nuevaPassword });
  return respuesta.data;
}

export async function obtenerTipoTokenPassword(token) {
  const respuesta = await api.get('/api/v1/auth/password-token-info', { params: { token } });
  return respuesta.data;
}

export async function establecerPasswordInvitacion(
  token,
  nuevaPassword,
  aceptaTerminos,
) {
  const respuesta = await api.post('/api/v1/auth/reset-password', {
    token,
    nuevaPassword,
    aceptaTerminos,
    versionTerminos: '1.0',
  });
  return respuesta.data;
}

export async function confirmarCambioEmail(token) {
  const respuesta = await api.post('/api/v1/auth/confirm-email-change', { token });
  return respuesta.data;
}
