import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarUsuariosAdministracion } from '../services/usuariosService.js';
import './AdministrarUsuarios.css';

const ROLES = [
  ['', 'Todos los roles'],
  ['administrador', 'Administrador'],
  ['alumno', 'Alumno'],
  ['staff', 'Staff'],
  ['tutor', 'Tutor'],
];

const ESTADOS = [
  ['', 'Todos los estados'],
  ['activo', 'Activo'],
  ['inactivo', 'Inactivo'],
  ['suspendido', 'Suspendido'],
  ['pendiente_verificacion', 'Pendiente de verificación'],
  ['dado_de_baja', 'Dado de baja'],
];

const TAMANIO_PAGINA = 20;

function nombreEstado(estado) {
  return ESTADOS.find(([clave]) => clave === estado)?.[1] || estado;
}

function nombreRol(rol) {
  return ROLES.find(([clave]) => clave === rol)?.[1] || rol;
}

function AdministrarUsuarios() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    tamanioPagina: TAMANIO_PAGINA,
    total: 0,
    totalPaginas: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function cargarUsuarios() {
      setCargando(true);
      setError('');
      try {
        const datos = await listarUsuariosAdministracion({
          ...(busquedaAplicada ? { busqueda: busquedaAplicada } : {}),
          ...(rol ? { rol } : {}),
          ...(estado ? { estado } : {}),
          pagina,
          tamanioPagina: TAMANIO_PAGINA,
        });
        if (!cancelado) {
          setUsuarios(datos.usuarios);
          setPaginacion(datos.paginacion);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err.response?.status === 403
              ? 'No tenés permisos para administrar usuarios'
              : 'No se pudo cargar el listado de usuarios',
          );
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarUsuarios();
    return () => {
      cancelado = true;
    };
  }, [busquedaAplicada, rol, estado, pagina]);

  function buscar(event) {
    event.preventDefault();
    setPagina(1);
    setBusquedaAplicada(busqueda.trim());
  }

  function cambiarRol(event) {
    setPagina(1);
    setRol(event.target.value);
  }

  function cambiarEstado(event) {
    setPagina(1);
    setEstado(event.target.value);
  }

  return (
    <main className="administracion">
      <header className="administracion__encabezado">
        <div>
          <Link to="/inicio" className="administracion__volver">← Inicio</Link>
          <h1>Usuarios</h1>
          <p>Administración individual de cuentas.</p>
        </div>
        <Link className="administracion__crear" to="/administracion/usuarios/nuevo">
          Crear usuario
        </Link>
      </header>

      <form className="administracion__filtros" onSubmit={buscar}>
        <label>
          <span>Búsqueda</span>
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre, apellido o email"
          />
        </label>
        <label>
          <span>Rol</span>
          <select value={rol} onChange={cambiarRol}>
            {ROLES.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Estado</span>
          <select value={estado} onChange={cambiarEstado}>
            {ESTADOS.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="administracion__buscar">Buscar</button>
      </form>

      {error && <p className="administracion__error" role="alert">{error}</p>}

      {cargando ? (
        <p className="administracion__estado">Cargando usuarios…</p>
      ) : usuarios.length === 0 ? (
        <p className="administracion__estado">No se encontraron usuarios.</p>
      ) : (
        <>
          <div className="administracion__tabla-contenedor">
            <table className="administracion__tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td data-label="Usuario">
                      <strong>{usuario.nombre} {usuario.apellido}</strong>
                      <small>{usuario.documento}</small>
                    </td>
                    <td data-label="Email">{usuario.email}</td>
                    <td data-label="Rol">{nombreRol(usuario.rol)}</td>
                    <td data-label="Estado">
                      <span className={`administracion__estado-badge administracion__estado-badge--${usuario.estado}`}>
                        {nombreEstado(usuario.estado)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="administracion__editar"
                        onClick={() => navigate(`/administracion/usuarios/${usuario.id}/editar`)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="administracion__paginacion">
            <span>
              Página {paginacion.pagina} de {paginacion.totalPaginas || 1}
              {' '}— {paginacion.total} usuarios
            </span>
            <div>
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((actual) => actual - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= paginacion.totalPaginas}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente
              </button>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}

export default AdministrarUsuarios;
