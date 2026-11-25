import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Icono from '../components/Icono.jsx';
import {
  COMUNICADO_DESTACADO,
  DISCIPLINAS,
} from '../data/feedEjemplo';
import {
  crearPublicacion,
  listarDisciplinasPublicacion,
  listarPublicaciones,
} from '../services/publicacionesService';
import './Inicio.css';

const NOMBRES_ROL = {
  administrador: 'Administrador',
  alumno: 'Alumno',
  staff: 'Staff',
  tutor: 'Tutor o líder de taller',
};

const FILTROS = [['todo', 'Todo'], ...Object.entries(DISCIPLINAS).map(([k, d]) => [k, d.nombre])];

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatearFecha(fecha) {
  const diferencia = Date.now() - new Date(fecha).getTime();
  const minutos = Math.max(1, Math.floor(diferencia / 60000));
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return new Date(fecha).toLocaleDateString('es-UY');
}

function Etiqueta({ disciplina }) {
  const d = DISCIPLINAS[disciplina] || { nombre: disciplina, fondo: '#ebebed', texto: '#62666d' };
  return (
    <span className="feed__etiqueta" style={{ background: d.fondo, color: d.texto }}>
      {d.nombre}
    </span>
  );
}

function Comunicado({ className = '' }) {
  return (
    <section className={`feed__comunicado ${className}`} aria-label="Comunicado destacado">
      <Icono nombre="megafono" />
      <div>
        <p className="feed__comunicado-titulo">{COMUNICADO_DESTACADO.titulo}</p>
        <p className="feed__comunicado-texto">{COMUNICADO_DESTACADO.texto}</p>
        <p className="feed__hace">{COMUNICADO_DESTACADO.autor}</p>
      </div>
    </section>
  );
}

function Publicacion({ publicacion, meGusta, onMeGusta, onProximamente, onAbrirImagen }) {
  const disciplina = DISCIPLINAS[publicacion.disciplina] || {
    nombre: publicacion.disciplina_nombre || publicacion.disciplina,
    texto: '#62666d',
  };
  const color = disciplina.texto;
  const reacciones = (publicacion.reacciones || 0) + (meGusta ? 1 : 0);
  const comentarios = publicacion.comentarios || 0;

  return (
    <article className="feed__tarjeta">
      <header className="feed__autor">
        <div className="feed__avatar" style={{ background: color }} aria-hidden="true">
          {iniciales(publicacion.autor)}
        </div>
        <div>
          <p className="feed__nombre">
            {publicacion.autor} <Etiqueta disciplina={publicacion.disciplina} />
          </p>
          <p className="feed__hace">{publicacion.hace}</p>
        </div>
      </header>

      <p className="feed__texto">
        {publicacion.texto}
        {publicacion.enlace_url && (
          <>
            {' '}
            <a className="feed__enlace" href={publicacion.enlace_url} target="_blank" rel="noreferrer">
              Ver enlace
            </a>
          </>
        )}
      </p>

      {publicacion.imagenes?.length > 0 && (
        <div className="feed__galeria">
          {publicacion.imagenes.map((imagen) => (
            <button
              key={imagen.id}
              type="button"
              className="feed__imagen-boton"
              onClick={() => onAbrirImagen(imagen)}
              aria-label="Ampliar imagen"
            >
              <img
                className="feed__imagen-real"
                src={`${import.meta.env.VITE_API_URL}${imagen.url}`}
                alt="Imagen de la publicación"
              />
            </button>
          ))}
        </div>
      )}

      <footer className="feed__acciones">
        <button
          type="button"
          className={`feed__accion ${meGusta ? 'feed__accion--activa' : ''}`}
          onClick={onMeGusta}
          aria-pressed={meGusta}
        >
          <Icono nombre="corazon" relleno={meGusta} tamano={22} />
          {reacciones} reacciones
        </button>
        <button type="button" className="feed__accion" onClick={onProximamente}>
          <Icono nombre="comentario" tamano={22} />
          {comentarios}
          <span className="sr-only"> comentarios</span>
        </button>
      </footer>
    </article>
  );
}

// Pantalla de inicio: vista previa del feed comunitario (wireframe 02).
// Mobile-first: en el celular, una columna con menú inferior; desde 768px,
// barra superior completa; desde 1024px, tres columnas (ver Inicio.css).
// Los datos son de ejemplo hasta implementar CU08 y CU09.
function Inicio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todo');
  const [meGusta, setMeGusta] = useState({});
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const [saliendo, setSaliendo] = useState(false);
  const [publicacionAbierta, setPublicacionAbierta] = useState(false);
  const [disciplinasApi, setDisciplinasApi] = useState([]);
  const [textoPublicacion, setTextoPublicacion] = useState('');
  const [enlacePublicacion, setEnlacePublicacion] = useState('');
  const [disciplinaPublicacion, setDisciplinaPublicacion] = useState('');
  const [imagenesPublicacion, setImagenesPublicacion] = useState([]);
  const [guardandoPublicacion, setGuardandoPublicacion] = useState(false);
  const [errorPublicacion, setErrorPublicacion] = useState('');
  const [publicacionesApi, setPublicacionesApi] = useState([]);
  const [cargandoPublicaciones, setCargandoPublicaciones] = useState(true);
  const [errorFeed, setErrorFeed] = useState('');
  const [revisionFeed, setRevisionFeed] = useState(0);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [zoomImagen, setZoomImagen] = useState(1);
  const distanciaPinza = useRef(0);
  const zoomInicialPinza = useRef(1);

  useEffect(() => {
    let cancelado = false;
    listarDisciplinasPublicacion()
      .then((datos) => {
        if (!cancelado) setDisciplinasApi(datos.disciplinas);
      })
      .catch(() => {
        if (!cancelado) setErrorPublicacion('No se pudieron cargar las disciplinas');
      });
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    let cancelado = false;
    listarPublicaciones({
      disciplina: filtro === 'todo' ? undefined : filtro,
      limite: 50,
    })
      .then((datos) => {
        if (!cancelado) {
          setErrorFeed('');
          setPublicacionesApi(datos.publicaciones.map((publicacion) => ({
            id: publicacion.id,
            autor: `${publicacion.autor_nombre} ${publicacion.autor_apellido}`.trim(),
            disciplina: publicacion.disciplina_codigo,
            disciplina_nombre: publicacion.disciplina_nombre,
            hace: formatearFecha(publicacion.fecha_creacion),
            texto: publicacion.texto,
            enlace_url: publicacion.enlace_url,
            imagenes: publicacion.imagenes,
            reacciones: 0,
            comentarios: 0,
          })));
        }
      })
      .catch(() => {
        if (!cancelado) setErrorFeed('No se pudieron cargar las publicaciones');
      })
      .finally(() => {
        if (!cancelado) setCargandoPublicaciones(false);
      });
    return () => { cancelado = true; };
  }, [filtro, revisionFeed]);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // El menú de la cuenta se cierra con Escape.
  useEffect(() => {
    if (!perfilAbierto) return undefined;
    const alPresionar = (e) => e.key === 'Escape' && setPerfilAbierto(false);
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [perfilAbierto]);

  useEffect(() => {
    if (!imagenAmpliada) return undefined;
    const alPresionar = (event) => event.key === 'Escape' && setImagenAmpliada(null);
    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alPresionar);
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = scrollOriginal;
    };
  }, [imagenAmpliada]);

  const proximamente = () => setAviso('Disponible en los próximos sprints');

  const publicaciones = publicacionesApi;

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
  const rol = NOMBRES_ROL[usuario.rol] || usuario.rol;

  async function handleLogout() {
    setSaliendo(true);
    await logout();
    navigate('/login', { replace: true });
  }

  function abrirPublicacion() {
    setErrorPublicacion('');
    setPublicacionAbierta(true);
  }

  function cerrarPublicacion() {
    if (guardandoPublicacion) return;
    setPublicacionAbierta(false);
    setErrorPublicacion('');
  }

  function cerrarImagen() {
    setImagenAmpliada(null);
    setZoomImagen(1);
  }

  function abrirImagen(imagen) {
    setZoomImagen(1);
    setImagenAmpliada(imagen);
  }

  function cambiarZoom(diferencia) {
    setZoomImagen((zoom) => Math.min(4, Math.max(0.5, Number((zoom + diferencia).toFixed(2)))));
  }

  function iniciarPinza(event) {
    if (event.touches.length !== 2) return;
    const [primerDedo, segundoDedo] = event.touches;
    distanciaPinza.current = Math.hypot(
      segundoDedo.clientX - primerDedo.clientX,
      segundoDedo.clientY - primerDedo.clientY,
    );
    zoomInicialPinza.current = zoomImagen;
  }

  function moverPinza(event) {
    if (event.touches.length !== 2 || distanciaPinza.current === 0) return;
    event.preventDefault();
    const [primerDedo, segundoDedo] = event.touches;
    const distanciaActual = Math.hypot(
      segundoDedo.clientX - primerDedo.clientX,
      segundoDedo.clientY - primerDedo.clientY,
    );
    const siguienteZoom = zoomInicialPinza.current * (distanciaActual / distanciaPinza.current);
    setZoomImagen(Math.min(4, Math.max(0.5, siguienteZoom)));
  }

  function cerrarImagen() {
    setImagenAmpliada(null);
    setZoomImagen(1);
  }

  async function publicar(event) {
    event.preventDefault();
    setErrorPublicacion('');
    if (!textoPublicacion.trim()) {
      setErrorPublicacion('Escribí el texto de la publicación');
      return;
    }
    if (!disciplinaPublicacion) {
      setErrorPublicacion('Seleccioná una disciplina');
      return;
    }

    setGuardandoPublicacion(true);
    try {
      await crearPublicacion({
        texto: textoPublicacion,
        enlaceUrl: enlacePublicacion,
        disciplinaId: Number(disciplinaPublicacion),
        imagenes: imagenesPublicacion,
      });
      setTextoPublicacion('');
      setEnlacePublicacion('');
      setDisciplinaPublicacion('');
      setImagenesPublicacion([]);
      setPublicacionAbierta(false);
      setRevisionFeed((revision) => revision + 1);
      setAviso('Publicación creada');
    } catch (err) {
      setErrorPublicacion(
        err.response?.data?.mensaje || 'No se pudo crear la publicación',
      );
    } finally {
      setGuardandoPublicacion(false);
    }
  }

  return (
    <div className="feed">
      <header className="feed__barra">
        <div className="feed__barra-interior">
          <h1 className="feed__logo">
            TUMO<span>NET</span>
          </h1>

          <button type="button" className="feed__busqueda" onClick={proximamente}>
            <Icono nombre="buscar" tamano={20} />
            <span>Buscar personas, proyectos o talleres…</span>
          </button>

          <div className="feed__iconos">
            <button type="button" className="feed__publicar-web" onClick={abrirPublicacion}>
              <Icono nombre="mas" tamano={20} />
              Publicar
            </button>
            <button
              type="button"
              className="feed__icono feed__solo-movil"
              aria-label="Buscar"
              onClick={proximamente}
            >
              <Icono nombre="buscar" />
            </button>
            <button
              type="button"
              className="feed__icono feed__icono--notificacion"
              aria-label="Notificaciones"
              onClick={proximamente}
            >
              <Icono nombre="campana" />
            </button>
            <button
              type="button"
              className="feed__cuenta"
              aria-label="Mi cuenta"
              aria-expanded={perfilAbierto}
              onClick={() => setPerfilAbierto((abierto) => !abierto)}
            >
              <span className="feed__avatar feed__avatar--chico" aria-hidden="true">
                {iniciales(nombreCompleto)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="feed__cuerpo">
        {/* Columna izquierda (solo en pantallas anchas) */}
        <aside className="feed__lateral" aria-label="Mi cuenta y navegación">
          <section className="feed__panel feed__usuario">
            <div className="feed__avatar feed__avatar--mediano" aria-hidden="true">
              {iniciales(nombreCompleto)}
            </div>
            <div>
              <p className="feed__usuario-nombre">{nombreCompleto}</p>
              <p className="feed__hace">{rol}</p>
            </div>
          </section>

          <nav className="feed__panel feed__nav-web" aria-label="Navegación principal">
            <button type="button" className="feed__nav-item feed__nav-item--activo" aria-current="page">
              <Icono nombre="inicio" relleno tamano={22} />
              Inicio
            </button>
            {usuario.rol === 'administrador' && (
              <>
                <button
                  type="button"
                  className="feed__nav-item"
                  onClick={() => navigate('/administracion/usuarios')}
                >
                  <Icono nombre="perfil" tamano={22} />
                  Usuarios
                </button>
                <button
                  type="button"
                  className="feed__nav-item"
                  onClick={() => navigate('/administracion/usuarios/nuevo')}
                >
                  <Icono nombre="mas" tamano={22} />
                  Crear usuario
                </button>
              </>
            )}
            {['administrador', 'staff', 'tutor'].includes(usuario.rol) && (
              <button
                type="button"
                className="feed__nav-item"
                onClick={() => navigate('/administracion/grupos')}
              >
                <Icono nombre="perfil" tamano={22} />
                Grupos
              </button>
            )}
            <button type="button" className="feed__nav-item" onClick={proximamente}>
              <Icono nombre="buscar" tamano={22} />
              Buscar
            </button>
            <button type="button" className="feed__nav-item" onClick={proximamente}>
              <Icono nombre="campana" tamano={22} />
              Comunicados
            </button>
            <button type="button" className="feed__nav-item" onClick={proximamente}>
              <Icono nombre="perfil" tamano={22} />
              Mi perfil
            </button>
            <hr className="feed__separador" />
            <button
              type="button"
              className="feed__nav-item"
              onClick={handleLogout}
              disabled={saliendo}
            >
              <Icono nombre="salir" tamano={22} />
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </nav>
        </aside>

        <main className="feed__principal">
          <nav className="feed__filtros" aria-label="Filtrar por disciplina">
            {FILTROS.map(([clave, nombre]) => (
              <button
                key={clave}
                type="button"
                className={`feed__filtro ${filtro === clave ? 'feed__filtro--activo' : ''}`}
                aria-pressed={filtro === clave}
                onClick={() => setFiltro(clave)}
              >
                {nombre}
              </button>
            ))}
          </nav>

          <div className="feed__contenido">
            <p className="feed__saludo">
              ¡Hola, <strong>{usuario.nombre}</strong>! Esto es lo nuevo en la comunidad.
            </p>

            {/* En pantallas anchas el comunicado va en la columna derecha */}
            {filtro === 'todo' && <Comunicado className="feed__comunicado--en-feed" />}

            {cargandoPublicaciones && <p className="feed__pie">Cargando publicaciones…</p>}
            {!cargandoPublicaciones && errorFeed && <p className="feed__pie" role="alert">{errorFeed}</p>}
            {!cargandoPublicaciones && !errorFeed && publicaciones.length === 0 && (
              <p className="feed__pie">Todavía no hay publicaciones en esta disciplina.</p>
            )}

            {!cargandoPublicaciones && publicaciones.map((p) => (
              <Publicacion
                key={p.id}
                publicacion={p}
                meGusta={Boolean(meGusta[p.id])}
                onMeGusta={() => setMeGusta((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                onProximamente={proximamente}
                onAbrirImagen={abrirImagen}
              />
            ))}
          </div>
        </main>

        {/* Columna derecha (solo en pantallas anchas) */}
        <aside className="feed__extra" aria-label="Novedades">
          <Comunicado />

          <section className="feed__panel">
            <h2 className="feed__panel-titulo">Disciplinas</h2>
            <ul className="feed__disciplinas">
              {Object.entries(DISCIPLINAS).map(([clave, d]) => (
                <li key={clave}>
                  <button
                    type="button"
                    className={`feed__disciplina ${filtro === clave ? 'feed__disciplina--activa' : ''}`}
                    aria-pressed={filtro === clave}
                    onClick={() => setFiltro(filtro === clave ? 'todo' : clave)}
                  >
                    <span className="feed__punto" style={{ background: d.texto }} aria-hidden="true" />
                    {d.nombre}
                    <span className="feed__cantidad">
                      {publicacionesApi.filter((p) => p.disciplina === clave).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {imagenAmpliada && (
        <div
          className="imagen__visor"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imagen"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cerrarImagen();
          }}
        >
          <div className="imagen__herramientas">
            <button type="button" onClick={() => cambiarZoom(-0.25)} aria-label="Alejar">−</button>
            <button type="button" onClick={() => setZoomImagen(1)} aria-label="Restablecer zoom">
              {Math.round(zoomImagen * 100)}%
            </button>
            <button type="button" onClick={() => cambiarZoom(0.25)} aria-label="Acercar">+</button>
            <button type="button" className="imagen__cerrar" onClick={cerrarImagen} aria-label="Cerrar">
              ×
            </button>
          </div>
          <div
            className="imagen__contenedor"
            onWheel={(event) => {
              event.preventDefault();
              event.stopPropagation();
              cambiarZoom(event.deltaY < 0 ? 0.25 : -0.25);
            }}
            onTouchStart={iniciarPinza}
            onTouchMove={moverPinza}
            onTouchEnd={() => { distanciaPinza.current = 0; }}
          >
            <img
              className="imagen__ampliada"
              src={`${import.meta.env.VITE_API_URL}${imagenAmpliada.url}`}
              alt="Imagen ampliada de la publicación"
              style={{ transform: `scale(${zoomImagen})` }}
            />
          </div>
        </div>
      )}

      {publicacionAbierta && (
        <div className="publicacion__fondo" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) cerrarPublicacion();
        }}>
          <section className="publicacion__modal" role="dialog" aria-modal="true" aria-labelledby="publicacion-titulo">
            <header className="publicacion__encabezado">
              <h2 id="publicacion-titulo">Crear publicación</h2>
              <button type="button" className="publicacion__cerrar" onClick={cerrarPublicacion} aria-label="Cerrar">
                ×
              </button>
            </header>
            <form className="publicacion__formulario" onSubmit={publicar}>
              <label htmlFor="publicacion-texto">Texto *</label>
              <textarea
                id="publicacion-texto"
                value={textoPublicacion}
                onChange={(event) => setTextoPublicacion(event.target.value)}
                maxLength={5000}
                rows={5}
                required
                placeholder="¿Qué querés compartir?"
              />

              <label htmlFor="publicacion-disciplina">Disciplina *</label>
              <select
                id="publicacion-disciplina"
                value={disciplinaPublicacion}
                onChange={(event) => setDisciplinaPublicacion(event.target.value)}
                required
              >
                <option value="">Seleccionar disciplina</option>
                {disciplinasApi.map((disciplina) => (
                  <option key={disciplina.id} value={disciplina.id}>{disciplina.nombre}</option>
                ))}
              </select>

              <label htmlFor="publicacion-enlace">Enlace</label>
              <input
                id="publicacion-enlace"
                type="url"
                value={enlacePublicacion}
                onChange={(event) => setEnlacePublicacion(event.target.value)}
                placeholder="https://..."
                maxLength={500}
              />

              <label htmlFor="publicacion-imagenes">Imágenes</label>
              <input
                id="publicacion-imagenes"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(event) => setImagenesPublicacion(Array.from(event.target.files).slice(0, 10))}
              />
              {imagenesPublicacion.length > 0 && (
                <p className="publicacion__archivos">
                  {imagenesPublicacion.length} {imagenesPublicacion.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
                </p>
              )}

              {errorPublicacion && <p className="publicacion__error" role="alert">{errorPublicacion}</p>}
              <button type="submit" className="publicacion__guardar" disabled={guardandoPublicacion}>
                {guardandoPublicacion ? 'Publicando…' : 'Publicar'}
              </button>
            </form>
          </section>
        </div>
      )}

      {aviso && (
        <p className="feed__aviso" role="status">
          {aviso}
        </p>
      )}

      {/* Menú inferior (solo en el celular) */}
      <nav className="feed__menu" aria-label="Navegación principal">
        <button type="button" className="feed__menu-item feed__menu-item--activo" aria-current="page">
          <Icono nombre="inicio" relleno />
          Inicio
        </button>
        <button type="button" className="feed__menu-item" onClick={proximamente}>
          <Icono nombre="buscar" />
          Buscar
        </button>
        <button type="button" className="feed__publicar" aria-label="Nueva publicación" onClick={abrirPublicacion}>
          <Icono nombre="mas" tamano={28} />
        </button>
        <button type="button" className="feed__menu-item" onClick={proximamente}>
          <Icono nombre="campana" />
          Comunicados
        </button>
        <button
          type="button"
          className="feed__menu-item"
          onClick={() => setPerfilAbierto(true)}
          aria-expanded={perfilAbierto}
        >
          <Icono nombre="perfil" />
          Perfil
        </button>
      </nav>

      {/* Mi cuenta: hoja inferior en el celular, menú desplegable en la web */}
      {perfilAbierto && (
        <div className="feed__fondo" onClick={() => setPerfilAbierto(false)}>
          <section
            className="feed__hoja"
            role="dialog"
            aria-modal="true"
            aria-label="Mi cuenta"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feed__avatar feed__avatar--grande" aria-hidden="true">
              {iniciales(nombreCompleto)}
            </div>
            <p className="feed__hoja-nombre">{nombreCompleto}</p>
            <p className="feed__hace">{usuario.email}</p>
            <span className="feed__rol">{rol}</span>

            {usuario.rol === 'administrador' && (
              <>
                <button
                  type="button"
                  className="feed__salir"
                  onClick={() => navigate('/administracion/usuarios')}
                >
                  <Icono nombre="perfil" tamano={20} />
                  Usuarios
                </button>
                <button
                  type="button"
                  className="feed__salir"
                  onClick={() => navigate('/administracion/usuarios/nuevo')}
                >
                  <Icono nombre="mas" tamano={20} />
                  Crear usuario
                </button>
              </>
            )}

            <button
              type="button"
              className="feed__salir"
              onClick={handleLogout}
              disabled={saliendo}
            >
              <Icono nombre="salir" tamano={20} />
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
            <button type="button" className="feed__cerrar" onClick={() => setPerfilAbierto(false)}>
              Volver al inicio
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default Inicio;
