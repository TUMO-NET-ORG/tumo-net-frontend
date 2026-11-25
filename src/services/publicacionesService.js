import api from './api';

export async function listarDisciplinasPublicacion() {
  const respuesta = await api.get('/api/v1/publicaciones/disciplinas');
  return respuesta.data;
}

export async function listarPublicaciones(params = {}) {
  const respuesta = await api.get('/api/v1/publicaciones', { params });
  return respuesta.data;
}

export async function crearPublicacion({ texto, enlaceUrl, disciplinaId, imagenes }) {
  const formData = new FormData();
  formData.append('texto', texto);
  formData.append('disciplina_id', String(disciplinaId));
  if (enlaceUrl) formData.append('enlace_url', enlaceUrl);
  for (const imagen of imagenes) formData.append('imagenes', imagen);

  const respuesta = await api.post('/api/v1/publicaciones', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return respuesta.data;
}
