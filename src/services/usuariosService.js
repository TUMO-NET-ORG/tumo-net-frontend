import api from './api';

export async function registrar(datos) {
  const respuesta = await api.post('/api/v1/usuarios/alta', datos);
  return respuesta.data;
}

export function verificarCodigo(email, codigo) {
  return api.post('/api/v1/auth/verify-email', { email, codigo });
}

export function reenviarCodigo(email) {
  return api.post('/api/v1/auth/resend-verification', { email });
}
