// Jerarquía de roles, de mayor a menor. Tiene que coincidir con el backend
// (src/server/v1/utils/roles.js). El backend es el que hace cumplir los
// permisos; acá solo se usan para mostrar u ocultar opciones.
export const ROLES = [
  ['superadmin', 'Superadmin'],
  ['administrador', 'Administrador'],
  ['staff', 'Staff'],
  ['tutor', 'Tutor'],
  ['alumno', 'Alumno'],
];

const CODIGOS = ROLES.map(([codigo]) => codigo);

// Todos menos el alumno: ven y gestionan usuarios y grupos.
export const ROLES_TRABAJADORES = CODIGOS.filter((rol) => rol !== 'alumno');

// Editan datos y restablecen la contraseña de otros trabajadores.
export const ROLES_ADMINISTRADORES = ['superadmin', 'administrador'];

export function nombreRol(rol) {
  return ROLES.find(([codigo]) => codigo === rol)?.[1] || rol;
}

export function esTrabajador(rol) {
  return ROLES_TRABAJADORES.includes(rol);
}

// true si `rol` está al mismo nivel o por debajo de `tope`.
export function rolIgualOInferior(rol, tope) {
  const posicionRol = CODIGOS.indexOf(rol);
  const posicionTope = CODIGOS.indexOf(tope);
  if (posicionRol === -1 || posicionTope === -1) return false;
  return posicionRol >= posicionTope;
}

// Roles del catálogo (los que trae el backend: [{ codigo, nombre }]) que
// `rolActor` puede asignar: el suyo y los inferiores.
export function rolesAsignables(catalogo, rolActor) {
  return catalogo.filter((rol) => rolIgualOInferior(rol.codigo, rolActor));
}

// Datos personales, email y contraseña: los de un alumno los cambia cualquier
// trabajador; los de un trabajador, solo un administrador o superadmin.
export function puedeEditarDatos(rolActor, rolObjetivo) {
  if (!rolIgualOInferior(rolObjetivo, rolActor)) return false;
  return rolObjetivo === 'alumno' || ROLES_ADMINISTRADORES.includes(rolActor);
}
