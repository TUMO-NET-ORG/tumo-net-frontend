import api from './api';

export async function registrar(datos) {
  const respuesta = await api.post('/api/v1/usuarios/alta', datos);
  return respuesta.data;
}

export async function crearUsuarioAdministrador(datos) {
  const respuesta = await api.post('/api/v1/usuarios', datos);
  return respuesta.data;
}

export async function solicitarCambioEmailAdministrador(id, email) {
  const respuesta = await api.post(`/api/v1/usuarios/${id}/cambio-email`, { email });
  return respuesta.data;
}

export async function listarUsuariosAdministracion(params = {}) {
  const respuesta = await api.get('/api/v1/usuarios', { params });
  return respuesta.data;
}

export async function listarCatalogosUsuario() {
  const respuesta = await api.get('/api/v1/usuarios/catalogos');
  return respuesta.data;
}

export async function obtenerUsuarioAdministracion(id) {
  const respuesta = await api.get(`/api/v1/usuarios/${id}`);
  return respuesta.data;
}

export async function editarUsuarioAdministracion(id, datos) {
  const respuesta = await api.patch(`/api/v1/usuarios/${id}`, datos);
  return respuesta.data;
}

export async function cambiarEstadoUsuarioAdministracion(id, estado) {
  const respuesta = await api.patch(`/api/v1/usuarios/${id}/estado`, { estado });
  return respuesta.data;
}

export async function restablecerPasswordUsuarioAdministracion(id) {
  const respuesta = await api.post(`/api/v1/usuarios/${id}/restablecer-password`);
  return respuesta.data;
}

export function verificarCodigo(email, codigo) {
  return api.post('/api/v1/auth/verify-email', { email, codigo });
}

export function reenviarCodigo(email) {
  return api.post('/api/v1/auth/resend-verification', { email });
}
