import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../context/useAuth';
import {
  crearGrupo,
  editarGrupo,
  listarUsuariosDisponibles,
  obtenerGrupo,
} from '../services/gruposService.js';
import './AdministrarGrupos.css';

function GestionarGrupo() {
  const { id } = useParams();
  const editar = Boolean(id);
  const navigate = useNavigate();
  const { usuario: usuarioAutenticado } = useAuth();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  // Al crear, quien crea el grupo queda como responsable por defecto (se puede sacar).
  const [responsables, setResponsables] = useState(
    () => (editar || !usuarioAutenticado ? [] : [Number(usuarioAutenticado.id)]),
  );
  const [integrantes, setIntegrantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(editar);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [panelActivo, setPanelActivo] = useState(null);
  const [seleccionPendiente, setSeleccionPendiente] = useState([]);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const [disponibles, detalle] = await Promise.all([
          listarUsuariosDisponibles(),
          editar ? obtenerGrupo(id) : Promise.resolve(null),
        ]);
        if (cancelado) return;
        setUsuarios(disponibles.usuarios);
        if (detalle) {
          setNombre(detalle.grupo.nombre);
          setDescripcion(detalle.grupo.descripcion || '');
          setResponsables(detalle.grupo.responsables.map((usuario) => usuario.id));
          setIntegrantes(detalle.grupo.integrantes.map((usuario) => usuario.id));
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.response?.status === 403
            ? 'No tenés permisos para gestionar este grupo'
            : 'No se pudo cargar la información del grupo');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [editar, id]);

  function abrirPanel(tipo) {
    setError('');
    setBusquedaUsuarios('');
    setSeleccionPendiente(tipo === 'responsables' ? responsables : integrantes);
    setPanelActivo(tipo);
  }

  function alternarUsuario(usuarioId) {
    setSeleccionPendiente((actuales) => (
      actuales.includes(usuarioId)
        ? actuales.filter((idUsuario) => idUsuario !== usuarioId)
        : [...actuales, usuarioId]
    ));
  }

  function aceptarSeleccion() {
    if (panelActivo === 'responsables') {
      // Igual que el backend: si alguien pasa a responsable, deja de ser integrante.
      setResponsables(seleccionPendiente);
      setIntegrantes((actuales) => actuales.filter((usuarioId) => !seleccionPendiente.includes(usuarioId)));
    } else {
      setIntegrantes(seleccionPendiente);
    }
    setPanelActivo(null);
  }

  function quitarResponsable(usuarioId) {
    setResponsables((actuales) => actuales.filter((idUsuario) => idUsuario !== usuarioId));
  }

  function quitarIntegrante(usuarioId) {
    setIntegrantes((actuales) => actuales.filter((idUsuario) => idUsuario !== usuarioId));
  }

  function nombreUsuario(usuarioId) {
    const usuario = usuarios.find((actual) => actual.id === usuarioId);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : `Usuario ${usuarioId}`;
  }

  function usuariosVisibles() {
    const texto = busquedaUsuarios.toLowerCase().trim();
    return usuarios.filter((usuario) => {
      if (panelActivo === 'responsables' && usuario.rol === 'alumno') return false;
      if (panelActivo === 'integrantes' && responsables.includes(usuario.id)) return false;
      if (!texto) return true;
      return `${usuario.nombre} ${usuario.apellido} ${usuario.email}`
        .toLowerCase()
        .includes(texto);
    });
  }

  async function guardar(event) {
    event.preventDefault();
    setError('');
    if (responsables.length === 0) {
      setError('Seleccioná al menos un responsable');
      return;
    }

    setGuardando(true);
    try {
      const datos = { nombre, descripcion, responsables, integrantes };
      if (editar) await editarGrupo(id, datos);
      else await crearGrupo(datos);
      navigate('/administracion/grupos', { replace: true });
    } catch (err) {
      const codigo = err.response?.data?.error;
      setError(
        codigo === 'GRUPO_YA_EXISTE'
          ? 'Ya existe un grupo con ese nombre'
          : err.response?.data?.mensaje || 'No se pudo guardar el grupo',
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="grupos__estado">Cargando grupo…</p>;

  return (
    <AuthLayout amplio>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">{editar ? 'Editar grupo' : 'Crear grupo'}</h1>
        <p className="auth__subtitulo">Definí el nombre, responsables e integrantes.</p>
      </header>
      <form className="grupos__formulario" onSubmit={guardar}>
        <label>
          Nombre *
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} minLength={3} maxLength={100} required />
        </label>
        <label>
          Turno o taller / descripción
          <textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} maxLength={500} rows={3} />
        </label>
        <div className="grupos__selecciones">
          <section className="grupos__seleccion">
            <h2>Responsables *</h2>
            <button type="button" className="grupos__selector-boton" onClick={() => abrirPanel('responsables')}>
              Definir responsables
            </button>
            <ul className="grupos__seleccionados">
              {responsables.length === 0
                ? <li>Ningún responsable seleccionado.</li>
                : responsables.map((usuarioId) => (
                  <li key={usuarioId}>
                    {nombreUsuario(usuarioId)}
                    <button
                      type="button"
                      className="grupos__quitar"
                      onClick={() => quitarResponsable(usuarioId)}
                      aria-label={`Quitar a ${nombreUsuario(usuarioId)} de responsables`}
                      title="Quitar"
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          </section>
          <section className="grupos__seleccion">
            <h2>Integrantes</h2>
            <button type="button" className="grupos__selector-boton" onClick={() => abrirPanel('integrantes')}>
              Definir integrantes
            </button>
            <ul className="grupos__seleccionados">
              {integrantes.length === 0
                ? <li>Ningún integrante seleccionado.</li>
                : integrantes.map((usuarioId) => (
                  <li key={usuarioId}>
                    {nombreUsuario(usuarioId)}
                    <button
                      type="button"
                      className="grupos__quitar"
                      onClick={() => quitarIntegrante(usuarioId)}
                      aria-label={`Quitar a ${nombreUsuario(usuarioId)} de integrantes`}
                      title="Quitar"
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </div>
        {error && <p className="grupos__error" role="alert">{error}</p>}
        <button type="submit" className="auth__boton" disabled={guardando}>
          {guardando ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear grupo'}
        </button>
      </form>
      <Link to="/administracion/grupos" className="auth__volver">Volver a grupos</Link>

      {panelActivo && (
        <div className="grupos__modal-fondo" role="presentation">
          <section className="grupos__modal" role="dialog" aria-modal="true">
            <h2>
              {panelActivo === 'responsables' ? 'Definir responsables' : 'Definir integrantes'}
            </h2>
            <input
              type="search"
              className="grupos__busqueda-usuarios"
              placeholder="Buscar por nombre o email"
              value={busquedaUsuarios}
              onChange={(event) => setBusquedaUsuarios(event.target.value)}
            />
            <div className="grupos__lista-usuarios">
              {usuariosVisibles().map((usuario) => (
                <label key={usuario.id} className="grupos__usuario-opcion">
                  <input
                    type="checkbox"
                    checked={seleccionPendiente.includes(usuario.id)}
                    onChange={() => alternarUsuario(usuario.id)}
                  />
                  <span>{usuario.nombre} {usuario.apellido}<small>{usuario.email}</small></span>
                </label>
              ))}
            </div>
            <div className="grupos__modal-acciones">
              <button type="button" className="grupos__cancelar" onClick={() => setPanelActivo(null)}>
                Cancelar
              </button>
              <button type="button" className="grupos__aceptar" onClick={aceptarSeleccion}>
                Aceptar
              </button>
            </div>
          </section>
        </div>
      )}
    </AuthLayout>
  );
}

export default GestionarGrupo;
