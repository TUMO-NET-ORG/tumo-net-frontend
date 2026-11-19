import api from './api';

export async function listarGrupos(params = {}) {
  const respuesta = await api.get('/api/v1/grupos', { params });
  return respuesta.data;
}

export async function obtenerGrupo(id) {
  const respuesta = await api.get(`/api/v1/grupos/${id}`);
  return respuesta.data;
}

export async function listarUsuariosDisponibles(buscar = '') {
  const respuesta = await api.get('/api/v1/grupos/usuarios-disponibles', {
    params: buscar ? { buscar } : {},
  });
  return respuesta.data;
}

export async function crearGrupo(datos) {
  const respuesta = await api.post('/api/v1/grupos', datos);
  return respuesta.data;
}

export async function editarGrupo(id, datos) {
  const respuesta = await api.put(`/api/v1/grupos/${id}`, datos);
  return respuesta.data;
}

export async function borrarGrupo(id) {
  await api.delete(`/api/v1/grupos/${id}`);
}
