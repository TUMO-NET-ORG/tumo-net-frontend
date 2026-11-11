import api from './api';

export async function login(email, password) {
  const respuesta = await api.post('/api/v1/auth/login', { email, password });
  return respuesta.data;
}

export async function logout() {
  await api.post('/api/v1/auth/logout');
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
