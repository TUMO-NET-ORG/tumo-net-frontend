import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Icono from '../components/Icono.jsx';
import {
  COMUNICADO_DESTACADO,
  DISCIPLINAS,
  PUBLICACIONES,
} from '../data/feedEjemplo';
import './Inicio.css';

const NOMBRES_ROL = {
  administrador: 'Administrador',
  alumno: 'Alumno',
  staff: 'Staff',
  tutor: 'Tutor o líder de taller',
};

function iniciales(nombre) {
  return nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Etiqueta({ disciplina }) {
  const d = DISCIPLINAS[disciplina];
  return (
    <span className="feed__etiqueta" style={{ background: d.fondo, color: d.texto }}>
      {d.nombre}
    </span>
  );
}

function Publicacion({ publicacion, meGusta, onMeGusta, onProximamente }) {
  const color = DISCIPLINAS[publicacion.disciplina].texto;
  const reacciones = publicacion.reacciones + (meGusta ? 1 : 0);

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
        {publicacion.enlace && (
          <>
            {' '}
            <button type="button" className="feed__enlace" onClick={onProximamente}>
              {publicacion.enlace}
            </button>
          </>
        )}
      </p>

      {publicacion.imagen && <div className="feed__imagen">[ imagen del proyecto ]</div>}

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
          {publicacion.comentarios}
          <span className="sr-only"> comentarios</span>
        </button>
      </footer>
    </article>
  );
}

// Pantalla de inicio: vista previa del feed comunitario (wireframe 02).
// Los datos son de ejemplo hasta implementar CU08 y CU09.
function Inicio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todo');
  const [meGusta, setMeGusta] = useState({});
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const proximamente = () => setAviso('Disponible en los próximos sprints');

  const publicaciones = PUBLICACIONES.filter(
    (p) => filtro === 'todo' || p.disciplina === filtro,
  );

  async function handleLogout() {
    setSaliendo(true);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="feed">
      <header className="feed__barra">
        <h1 className="feed__logo">
          TUMO<span>NET</span>
        </h1>
        <div className="feed__iconos">
          <button type="button" className="feed__icono" aria-label="Buscar" onClick={proximamente}>
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
        </div>
      </header>

      <nav className="feed__filtros" aria-label="Filtrar por disciplina">
        {[['todo', 'Todo'], ...Object.entries(DISCIPLINAS).map(([k, d]) => [k, d.nombre])].map(
          ([clave, nombre]) => (
            <button
              key={clave}
              type="button"
              className={`feed__filtro ${filtro === clave ? 'feed__filtro--activo' : ''}`}
              aria-pressed={filtro === clave}
              onClick={() => setFiltro(clave)}
            >
              {nombre}
            </button>
          ),
        )}
      </nav>

      <main className="feed__contenido">
        <p className="feed__saludo">
          ¡Hola, <strong>{usuario.nombre}</strong>! Esto es lo nuevo en la comunidad.
        </p>

        {filtro === 'todo' && (
          <section className="feed__comunicado" aria-label="Comunicado destacado">
            <Icono nombre="megafono" />
            <div>
              <p className="feed__comunicado-titulo">{COMUNICADO_DESTACADO.titulo}</p>
              <p className="feed__comunicado-texto">{COMUNICADO_DESTACADO.texto}</p>
              <p className="feed__hace">{COMUNICADO_DESTACADO.autor}</p>
            </div>
          </section>
        )}

        {publicaciones.map((p) => (
          <Publicacion
            key={p.id}
            publicacion={p}
            meGusta={Boolean(meGusta[p.id])}
            onMeGusta={() => setMeGusta((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
            onProximamente={proximamente}
          />
        ))}

        <p className="feed__pie">
          Vista previa con publicaciones de ejemplo. El feed real llega con la creación de publicaciones.
        </p>
      </main>

      {aviso && (
        <p className="feed__aviso" role="status">
          {aviso}
        </p>
      )}

      <nav className="feed__menu" aria-label="Navegación principal">
        <button type="button" className="feed__menu-item feed__menu-item--activo" aria-current="page">
          <Icono nombre="inicio" relleno />
          Inicio
        </button>
        <button type="button" className="feed__menu-item" onClick={proximamente}>
          <Icono nombre="buscar" />
          Buscar
        </button>
        <button type="button" className="feed__publicar" aria-label="Nueva publicación" onClick={proximamente}>
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
              {iniciales(`${usuario.nombre} ${usuario.apellido || ''}`)}
            </div>
            <p className="feed__hoja-nombre">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="feed__hace">{usuario.email}</p>
            <span className="feed__rol">{NOMBRES_ROL[usuario.rol] || usuario.rol}</span>

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
