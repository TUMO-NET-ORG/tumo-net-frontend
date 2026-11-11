// Datos de EJEMPLO para mostrar cómo se verá el feed (wireframe "Feed
// comunitario"). Se reemplazan por la API cuando se implementen CU08
// (publicaciones) y CU09 (interactuar con el feed).

export const DISCIPLINAS = {
  programacion: { nombre: 'Programación', fondo: '#e7f0fa', texto: '#2f5f99' },
  diseno: { nombre: 'Diseño', fondo: '#f3e6f3', texto: '#702572' },
  animacion: { nombre: 'Animación', fondo: '#fde9e2', texto: '#a8371a' },
  robotica: { nombre: 'Robótica', fondo: '#e0f4f6', texto: '#0b6f7a' },
};

export const COMUNICADO_DESTACADO = {
  titulo: 'Muestra de proyectos de fin de año',
  texto: 'El sábado 13/12 presentamos los proyectos de todos los talleres. ¡Prepará el tuyo!',
  autor: 'Equipo TUMO',
};

export const PUBLICACIONES = [
  {
    id: 1,
    autor: 'Valentina M.',
    disciplina: 'diseno',
    hace: 'hace 2 horas',
    texto: 'Terminé el rediseño de marca para mi proyecto final de identidad visual. ¿Qué les parece?',
    imagen: true,
    reacciones: 12,
    comentarios: 4,
  },
  {
    id: 2,
    autor: 'Mateo R.',
    disciplina: 'programacion',
    hace: 'hace 5 horas',
    texto: 'Subí mi juego de lógica al porfolio. JavaScript puro, sin frameworks.',
    enlace: 'Ver en porfolio →',
    reacciones: 8,
    comentarios: 2,
  },
  {
    id: 3,
    autor: 'Lucía P.',
    disciplina: 'animacion',
    hace: 'hace 1 día',
    texto: 'Primer corto en stop motion del taller: 240 fotos para 20 segundos 😅',
    imagen: true,
    reacciones: 21,
    comentarios: 7,
  },
  {
    id: 4,
    autor: 'Tomás G.',
    disciplina: 'robotica',
    hace: 'hace 2 días',
    texto: 'Nuestro robot seguidor de línea ya completa el circuito en menos de 10 segundos.',
    reacciones: 15,
    comentarios: 3,
  },
];
