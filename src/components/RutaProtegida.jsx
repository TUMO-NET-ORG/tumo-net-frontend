import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { esTrabajador } from '../data/roles';

// RF7: ningún contenido es visible sin iniciar sesión.
export function RutaProtegida() {
  const { usuario, autenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="auth__subtitulo">Cargando…</p>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (
    usuario.debeCambiarPassword
    && location.pathname !== '/cambiar-contrasena'
  ) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  return <Outlet />;
}

// Administración de usuarios: todos los trabajadores (todos menos alumno).
// Qué puede hacer cada uno sobre cada usuario lo controla el backend.
export function RutaAdministrador() {
  const { usuario, autenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="auth__subtitulo">Cargando…</p>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (!esTrabajador(usuario.rol)) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}

export function RutaGestionGrupos() {
  const { usuario, autenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="auth__subtitulo">Cargando…</p>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (!esTrabajador(usuario.rol)) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}

// Login, registro y recuperación: si ya hay sesión, se va al inicio.
export function RutaPublica() {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return <p className="auth__subtitulo">Cargando…</p>;
  }

  return autenticado ? <Navigate to="/inicio" replace /> : <Outlet />;
}
