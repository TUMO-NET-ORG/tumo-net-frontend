import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import {
  login as loginApi,
  logout as logoutApi,
  obtenerSesion,
} from '../services/authService';
import {
  EVENTO_SESION_EXPIRADA,
  borrarSesionGuardada,
  guardarSesion,
  obtenerToken,
} from '../services/sesion';
import { listarCatalogosUsuario } from '../services/usuariosService';

// Mantiene la sesión del usuario (RF7: sin sesión no se ve contenido).
// Al cargar la app valida el token guardado contra GET /auth/me.
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(obtenerToken()));
  const [roles, setRoles] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);

  useEffect(() => {
    if (!obtenerToken()) {
      return;
    }

    let cancelado = false;
    obtenerSesion()
      .then((datos) => {
        if (!cancelado) setUsuario(datos.usuario);
      })
      .catch(() => {
        borrarSesionGuardada();
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  useEffect(() => {
    if (usuario?.rol !== 'administrador') {
      setRoles([]);
      setEstados([]);
      return;
    }

    let cancelado = false;
    setCargandoCatalogos(true);
    listarCatalogosUsuario()
      .then((datos) => {
        if (!cancelado) {
          setRoles(datos.roles);
          setEstados(datos.estados);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setRoles([]);
          setEstados([]);
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoCatalogos(false);
      });
    return () => { cancelado = true; };
  }, [usuario?.rol]);

  const login = useCallback(async (email, password) => {
    const datos = await loginApi(email, password);
    guardarSesion(datos.token, datos.usuario);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Aunque falle el aviso al servidor, la sesión local se cierra igual.
    }
    borrarSesionGuardada();
    setUsuario(null);
  }, []);

  const actualizarSesion = useCallback((token, datosUsuario) => {
    guardarSesion(token, datosUsuario);
    setUsuario(datosUsuario);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: Boolean(usuario),
      login,
      logout,
      actualizarSesion,
      roles,
      estados,
      cargandoCatalogos,
    }),
    [usuario, cargando, login, logout, actualizarSesion, roles, estados, cargandoCatalogos],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
