import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { borrarGrupo, listarGrupos, obtenerGrupo } from '../services/gruposService.js';
import './AdministrarGrupos.css';

function AdministrarGrupos() {
  const navigate = useNavigate();
  const [buscar, setBuscar] = useState('');
  const [buscarAplicada, setBuscarAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [grupos, setGrupos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 0, total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(null);
  const [grupoExpandido, setGrupoExpandido] = useState(null);
  const [detalleGrupo, setDetalleGrupo] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const datos = await listarGrupos({
          pagina,
          limite: 20,
          ...(buscarAplicada ? { buscar: buscarAplicada } : {}),
        });
        if (!cancelado) {
          setGrupos(datos.grupos);
          setPaginacion(datos.paginacion);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.response?.status === 403
            ? 'No tenés permisos para gestionar grupos'
            : 'No se pudo cargar el listado de grupos');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [pagina, buscarAplicada]);

  function buscarGrupos(event) {
    event.preventDefault();
    setPagina(1);
    setBuscarAplicada(buscar.trim());
  }

  async function confirmarEliminacion() {
    setBorrando(grupoAEliminar.id);
    setError('');
    try {
      await borrarGrupo(grupoAEliminar.id);
      setGrupos((actuales) => actuales.filter((actual) => actual.id !== grupoAEliminar.id));
      setGrupoAEliminar(null);
    } catch (err) {
      setError(
        err.response?.data?.error === 'GRUPO_NO_ENCONTRADO'
          ? 'El grupo no existe o ya fue eliminado'
          : err.response?.status === 403
            ? 'No tenés permisos para eliminar este grupo'
            : 'No se pudo eliminar el grupo',
      );
    } finally {
      setBorrando(null);
    }
  }

  async function alternarDetalle(grupoId) {
    if (grupoExpandido === grupoId) {
      setGrupoExpandido(null);
      setDetalleGrupo(null);
      return;
    }

    setGrupoExpandido(grupoId);
    setDetalleGrupo(null);
    setCargandoDetalle(true);
    try {
      const datos = await obtenerGrupo(grupoId);
      setDetalleGrupo(datos.grupo);
    } catch {
      setError('No se pudo cargar el detalle del grupo');
      setGrupoExpandido(null);
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <main className="grupos">
      <header className="grupos__encabezado">
        <div>
          <Link to="/inicio" className="grupos__volver">← Inicio</Link>
          <h1>Grupos</h1>
          <p>Organizá grupos, responsables e integrantes.</p>
        </div>
        <Link className="grupos__crear" to="/administracion/grupos/nuevo">
          Crear grupo
        </Link>
      </header>

      <form className="grupos__filtros" onSubmit={buscarGrupos}>
        <label>
          Buscar grupo
          <input
            type="search"
            value={buscar}
            onChange={(event) => setBuscar(event.target.value)}
            placeholder="Nombre del grupo"
          />
        </label>
        <button type="submit" className="grupos__buscar">Buscar</button>
      </form>

      {error && <p className="grupos__error" role="alert">{error}</p>}
      {cargando ? (
        <p className="grupos__estado">Cargando grupos…</p>
      ) : grupos.length === 0 ? (
        <p className="grupos__estado">No se encontraron grupos.</p>
      ) : (
        <>
          <div className="grupos__tabla-contenedor">
            <table className="grupos__tabla">
              <thead>
                <tr><th>Grupo</th><th>Descripción</th><th>Integrantes</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <Fragment key={grupo.id}>
                    <tr>
                    <td data-label="Grupo">
                      <button
                        type="button"
                        className="grupos__nombre"
                        onClick={() => alternarDetalle(grupo.id)}
                        aria-expanded={grupoExpandido === grupo.id}
                      >
                        <strong>{grupo.nombre}</strong>
                        <small>{grupoExpandido === grupo.id ? 'Ocultar integrantes' : 'Ver integrantes'}</small>
                      </button>
                    </td>
                    <td data-label="Descripción">{grupo.descripcion || '—'}</td>
                    <td data-label="Integrantes">{grupo.cantidad_integrantes}</td>
                    <td>
                      <div className="grupos__acciones">
                        <button
                          type="button"
                          className="grupos__editar"
                          onClick={() => navigate(`/administracion/grupos/${grupo.id}/editar`)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="grupos__eliminar"
                          disabled={borrando === grupo.id}
                          onClick={() => setGrupoAEliminar(grupo)}
                        >
                          {borrando === grupo.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                    </tr>
                    {grupoExpandido === grupo.id && (
                      <tr className="grupos__detalle">
                        <td colSpan="4">
                          {cargandoDetalle ? (
                            <p>Cargando integrantes…</p>
                          ) : detalleGrupo ? (
                            <>
                              <h3>Responsables</h3>
                              <ul>
                                {detalleGrupo.responsables.map((usuario) => (
                                  <li key={usuario.id}>{usuario.nombre} {usuario.apellido}</li>
                                ))}
                              </ul>
                              <h3>Integrantes</h3>
                              <ul>
                                {detalleGrupo.integrantes.length === 0
                                  ? <li>No hay integrantes asignados.</li>
                                  : detalleGrupo.integrantes.map((usuario) => (
                                    <li key={usuario.id}>{usuario.nombre} {usuario.apellido}</li>
                                  ))}
                              </ul>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="grupos__paginacion">
            <span>Página {paginacion.pagina} de {paginacion.totalPaginas || 1} — {paginacion.total} grupos</span>
            <div>
              <button type="button" disabled={pagina <= 1} onClick={() => setPagina((actual) => actual - 1)}>
                Anterior
              </button>
              <button type="button" disabled={pagina >= paginacion.totalPaginas} onClick={() => setPagina((actual) => actual + 1)}>
                Siguiente
              </button>
            </div>
          </footer>
        </>
      )}

      {grupoAEliminar && (
        <div className="grupos__modal-fondo" role="presentation">
          <section className="grupos__modal" role="dialog" aria-modal="true" aria-labelledby="eliminar-grupo-titulo">
            <h2 id="eliminar-grupo-titulo">Confirmar eliminación</h2>
            <p>
              ¿Querés eliminar el grupo <strong>{grupoAEliminar.nombre}</strong>?
            </p>
            <p>Sus integrantes quedarán desvinculados y el grupo dejará de aparecer en el listado.</p>
            <div className="grupos__modal-acciones">
              <button
                type="button"
                className="grupos__cancelar"
                onClick={() => setGrupoAEliminar(null)}
                disabled={borrando === grupoAEliminar.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="grupos__eliminar"
                onClick={confirmarEliminacion}
                disabled={borrando === grupoAEliminar.id}
              >
                {borrando === grupoAEliminar.id ? 'Eliminando…' : 'Eliminar grupo'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdministrarGrupos;
