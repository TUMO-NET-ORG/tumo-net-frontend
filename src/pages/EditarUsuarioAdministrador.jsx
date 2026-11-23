import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Input from '../components/Input.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../context/useAuth';
import {
  cambiarEstadoUsuarioAdministracion,
  editarUsuarioAdministracion,
  obtenerUsuarioAdministracion,
  restablecerPasswordUsuarioAdministracion,
  solicitarCambioEmailAdministrador,
} from '../services/usuariosService.js';
import { MENSAJE_CEDULA, cedulaValida } from '../services/cedula.js';
import { mensajeDelServidor } from '../services/password.js';
import './AdministrarUsuarios.css';

const ROLES = [
  ['administrador', 'Administrador'],
  ['alumno', 'Alumno'],
  ['staff', 'Staff'],
  ['tutor', 'Tutor'],
];

const ESTADOS = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  suspendido: 'Suspendido',
  pendiente_verificacion: 'Pendiente de verificación',
  dado_de_baja: 'Dado de baja',
};

const ACCIONES_ESTADO = [
  ['activo', 'Activar'],
  ['dado_de_baja', 'Dar de baja'],
  ['suspendido', 'Suspender'],
];

function fechaActualLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Avisa qué grupos impiden el cambio, con un link a cada uno para reasignar al responsable.
function AvisoGrupos({ bloqueo }) {
  return (
    <div className="administracion__aviso-grupos" role="alert">
      <p>{bloqueo.mensaje}</p>
      <ul>
        {bloqueo.grupos.map((grupo) => (
          <li key={grupo.id}>
            <Link to={`/administracion/grupos/${grupo.id}/editar`}>{grupo.nombre}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditarUsuarioAdministrador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: usuarioAutenticado } = useAuth();
  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [erroresCampos, setErroresCampos] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [avisoEmail, setAvisoEmail] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [estadoActual, setEstadoActual] = useState('');
  const [estadoPendiente, setEstadoPendiente] = useState(null);
  // { seccion: 'datos' | 'estado', mensaje, grupos: [{ id, nombre }] } cuando el backend
  // rechaza el cambio porque algún grupo quedaría sin responsable.
  const [bloqueoGrupos, setBloqueoGrupos] = useState(null);
  const [confirmarRestablecimiento, setConfirmarRestablecimiento] = useState(false);
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [restableciendoPassword, setRestableciendoPassword] = useState(false);
  const [passwordCopiada, setPasswordCopiada] = useState(false);
  const puedeCambiarEstado = String(usuarioAutenticado?.id) !== String(id);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const datos = await obtenerUsuarioAdministracion(id);
        if (!cancelado) {
          const usuario = datos.usuario;
          const fechaNacimiento = usuario.fechaNacimiento
            ? String(usuario.fechaNacimiento).slice(0, 10)
            : '';
          const valores = {
            nombre: usuario.nombre || '',
            apellido: usuario.apellido || '',
            documento: usuario.documento || '',
            email: usuario.email || '',
            fechaNacimiento,
            fotoUrl: usuario.fotoUrl || '',
            urlPortfolio: usuario.urlPortfolio || '',
            rol: usuario.rol || 'alumno',
          };
          setOriginal(valores);
          setForm(valores);
          setEstadoActual(usuario.estado || '');
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err.response?.status === 404
              ? 'El usuario no existe'
              : err.response?.status === 403
                ? 'No tenés permisos para editar usuarios'
                : 'No se pudo cargar el usuario',
          );
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'fechaNacimiento' && value && value > fechaActualLocal()) {
      return;
    }
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  function mensajeCampo(nombre) {
    return erroresCampos.find((detalle) => detalle.campo === nombre)?.mensaje;
  }

  async function confirmarCambioEstado() {
    setError('');
    setBloqueoGrupos(null);
    setCambiandoEstado(true);
    try {
      const resultado = await cambiarEstadoUsuarioAdministracion(
        id,
        estadoPendiente.clave,
      );
      setEstadoActual(resultado.usuario.estado);
      setEstadoPendiente(null);
    } catch (err) {
      if (err.response?.data?.error === 'UNICO_RESPONSABLE_DE_GRUPOS') {
        setEstadoPendiente(null);
        setBloqueoGrupos({
          seccion: 'estado',
          mensaje: 'No se puede dar de baja: es el único responsable de estos grupos. Asigná otro responsable primero.',
          grupos: err.response.data.grupos || [],
        });
        return;
      }
      setError(
        err.response?.status === 403
          ? 'No tenés permisos para cambiar estados'
          : err.response?.status === 400
            ? err.response?.data?.error === 'DATOS_INVALIDOS'
              ? 'El estado seleccionado no es válido'
              : err.response?.data?.mensaje || 'No se puede cambiar el estado de este usuario'
            : err.response?.data?.error === 'USUARIO_NO_ENCONTRADO'
              ? 'El usuario no existe'
            : 'No se pudo cambiar el estado del usuario',
      );
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function restablecerPassword() {
    setError('');
    setRestableciendoPassword(true);
    try {
      const resultado = await restablecerPasswordUsuarioAdministracion(id);
      setConfirmarRestablecimiento(false);
      setPasswordTemporal(resultado.passwordTemporal);
      setPasswordCopiada(false);
    } catch (err) {
      setConfirmarRestablecimiento(false);
      if (err.response?.data?.error === 'AUTO_RESTABLECER_PASSWORD') {
        setError('No podés restablecer tu propia contraseña desde acá');
      } else if (err.response?.data?.error === 'USUARIO_NO_ENCONTRADO') {
        setError('El usuario no existe. Volvé al listado para actualizarlo.');
      } else {
        setError('No se pudo restablecer la contraseña');
      }
    } finally {
      setRestableciendoPassword(false);
    }
  }

  async function copiarPasswordTemporal() {
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setPasswordCopiada(true);
    } catch {
      setError('No se pudo copiar la contraseña. Seleccionala manualmente.');
    }
  }

  async function handleCambioEmail(event) {
    event.preventDefault();
    setError('');
    setAvisoEmail('');
    setCambiandoEmail(true);
    try {
      await solicitarCambioEmailAdministrador(id, nuevoEmail);
      setAvisoEmail('Se envió un enlace al nuevo email. El cambio queda pendiente de confirmación.');
      setNuevoEmail('');
    } catch (err) {
      setError(
        err.response?.data?.error === 'DATOS_INVALIDOS'
          ? mensajeDelServidor(err) || 'El email no es válido'
          : err.response?.status === 409
            ? 'Ese email ya está registrado'
            : 'No se pudo enviar el enlace de confirmación',
      );
    } finally {
      setCambiandoEmail(false);
    }
  }

  async function handleGuardar(event) {
    event.preventDefault();
    setError('');
    setErroresCampos([]);
    setBloqueoGrupos(null);

    if (!cedulaValida(form.documento)) {
      setError(MENSAJE_CEDULA);
      return;
    }
    if (form.fechaNacimiento && form.fechaNacimiento > fechaActualLocal()) {
      setError('La fecha de nacimiento no puede ser posterior a hoy');
      return;
    }

    const cambios = {};
    Object.entries(form).forEach(([campo, valor]) => {
      const valorOriginal = original[campo];
      if (valor !== valorOriginal) {
        cambios[campo] = valor === '' ? null : valor;
      }
    });

    if (Object.keys(cambios).length === 0) {
      setError('No hiciste cambios');
      return;
    }

    setGuardando(true);
    try {
      await editarUsuarioAdministracion(id, cambios);
      navigate('/administracion/usuarios', {
        replace: true,
        state: { actualizado: true },
      });
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor');
      } else if (err.response.status === 403) {
        setError('No tenés permisos para editar usuarios');
      } else if (err.response.status === 404) {
        setError('El usuario no existe');
      } else if (err.response.data?.error === 'RESPONSABLE_DE_GRUPOS') {
        setBloqueoGrupos({
          seccion: 'datos',
          mensaje: 'No se puede cambiar a ese rol: es responsable de estos grupos. Asigná otro responsable primero.',
          grupos: err.response.data.grupos || [],
        });
      } else if (err.response.status === 409) {
        setError(
          err.response.data?.error === 'EMAIL_DUPLICADO'
            ? 'Ya existe un usuario con ese email'
            : 'Ya existe un usuario con esa cédula',
        );
      } else if (err.response.data?.error === 'DATOS_INVALIDOS') {
        setErroresCampos(err.response.data.detalles || []);
        setError(mensajeDelServidor(err) || 'Revisá los datos ingresados');
      } else if (err.response.data?.error === 'AUTO_CAMBIO_ROL') {
        setError('No podés quitarte a vos mismo el rol de administrador');
      } else {
        setError('No se pudo editar el usuario');
      }
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <p className="administracion__estado">Cargando usuario…</p>;
  }

  if (!form) {
    return (
      <AuthLayout>
        <h1 className="auth__titulo">No disponible</h1>
        {error && <p className="auth__error">{error}</p>}
        <Link to="/administracion/usuarios" className="auth__boton">
          Volver al listado
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout amplio>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Editar usuario</h1>
        <p className="auth__subtitulo">Modificá los datos de la cuenta.</p>
      </header>

      <form className="auth__form" onSubmit={handleGuardar}>
        <div className="auth__fila">
          <div className="auth__campo">
            <Input label="Nombre *" id="nombre" name="nombre"
              value={form.nombre} onChange={handleChange} maxLength={100} required />
            {mensajeCampo('nombre') && <p className="auth__error">{mensajeCampo('nombre')}</p>}
          </div>
          <div className="auth__campo">
            <Input label="Apellido *" id="apellido" name="apellido"
              value={form.apellido} onChange={handleChange} maxLength={100} required />
            {mensajeCampo('apellido') && <p className="auth__error">{mensajeCampo('apellido')}</p>}
          </div>
        </div>

        <div className="auth__fila">
          <div className="auth__campo">
            <Input label="Cédula de identidad *" id="documento" name="documento"
              value={form.documento} onChange={handleChange} maxLength={20} required />
          </div>
          <div className="auth__campo">
            <Input label="Fecha de nacimiento" id="fechaNacimiento" name="fechaNacimiento"
              type="date" value={form.fechaNacimiento} onChange={handleChange}
              max={fechaActualLocal()} />
          </div>
        </div>

        <Input label="Email *" id="email" name="email" type="email"
          value={form.email} readOnly />

        <div className="auth__campo">
          <label htmlFor="rol" className="auth__label">Rol *</label>
          <select id="rol" name="rol" className="auth__select"
            value={form.rol} onChange={handleChange}>
            {ROLES.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
        </div>

        <Input label="Foto" id="fotoUrl" name="fotoUrl" type="url"
          value={form.fotoUrl} onChange={handleChange} maxLength={500} />
        <Input label="Portfolio" id="urlPortfolio" name="urlPortfolio" type="url"
          value={form.urlPortfolio} onChange={handleChange} maxLength={500} />

        {error && <p className="auth__error">{error}</p>}
        {bloqueoGrupos?.seccion === 'datos' && <AvisoGrupos bloqueo={bloqueoGrupos} />}

        <button type="submit" className="auth__boton" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <section className="administracion__estado-cambio">
        <div>
          <h2>Estado del usuario</h2>
          <span className={`administracion__estado-badge administracion__estado-badge--${estadoActual}`}>
            {ESTADOS[estadoActual] || estadoActual}
          </span>
        </div>
        {puedeCambiarEstado && estadoActual !== 'pendiente_verificacion' && (
          <div className="administracion__acciones">
            {ACCIONES_ESTADO
              .filter(([clave]) => clave !== estadoActual)
              .map(([clave, nombre]) => (
                <button
                  key={clave}
                  type="button"
                  className={`administracion__estado-accion administracion__estado-accion--${clave}`}
                  onClick={() => setEstadoPendiente({ clave, nombre })}
                  disabled={cambiandoEstado}
                >
                  {nombre}
                </button>
              ))}
          </div>
        )}
        {bloqueoGrupos?.seccion === 'estado' && <AvisoGrupos bloqueo={bloqueoGrupos} />}
      </section>

      {puedeCambiarEstado && (
        <section className="administracion__email-cambio">
            <h2>Solicitar cambio de email</h2>
            <p>La dirección actual no se modifica hasta confirmar el enlace enviado al nuevo email.</p>
            <form className="administracion__email-cambio-form" onSubmit={handleCambioEmail}>
              <Input label="Nuevo email" id="nuevoEmail" name="nuevoEmail" type="email"
                value={nuevoEmail} onChange={(event) => setNuevoEmail(event.target.value)} required />
              <button type="submit" className="administracion__buscar" disabled={cambiandoEmail}>
                {cambiandoEmail ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
            {avisoEmail && <p className="mensaje-exito">{avisoEmail}</p>}
        </section>
      )}

      {puedeCambiarEstado && (
        <section className="administracion__email-cambio">
          <h2>Restablecer contraseña</h2>
          <p>Se generará una contraseña temporal que el usuario deberá cambiar en su próximo ingreso.</p>
          <button
            type="button"
            className="administracion__buscar"
            onClick={() => setConfirmarRestablecimiento(true)}
          >
            Restablecer contraseña
          </button>
        </section>
      )}

      <Link to="/administracion/usuarios" className="auth__volver">Volver al listado</Link>

      {estadoPendiente && (
        <div className="administracion__modal-fondo" role="presentation">
          <section
            className="administracion__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-estado-titulo"
          >
            <h2 id="confirmar-estado-titulo">Confirmar cambio de estado</h2>
            <p>
              ¿Querés cambiar el estado del usuario a
              {' '}
              <strong>{estadoPendiente.nombre}</strong>?
            </p>
            {estadoPendiente.clave === 'dado_de_baja' && (
              <p>El usuario no podrá acceder, pero sus datos se conservarán.</p>
            )}
            <div className="administracion__modal-acciones">
              <button
                type="button"
                className="administracion__modal-cancelar"
                onClick={() => setEstadoPendiente(null)}
                disabled={cambiandoEstado}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="administracion__modal-confirmar"
                onClick={confirmarCambioEstado}
                disabled={cambiandoEstado}
              >
                {cambiandoEstado ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmarRestablecimiento && (
        <div className="administracion__modal-fondo" role="presentation">
          <section className="administracion__modal" role="dialog" aria-modal="true">
            <h2>Confirmar restablecimiento</h2>
            <p>¿Querés generar una nueva contraseña temporal para este usuario?</p>
            <div className="administracion__modal-acciones">
              <button
                type="button"
                className="administracion__modal-cancelar"
                onClick={() => setConfirmarRestablecimiento(false)}
                disabled={restableciendoPassword}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="administracion__modal-confirmar"
                onClick={restablecerPassword}
                disabled={restableciendoPassword}
              >
                {restableciendoPassword ? 'Generando...' : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {passwordTemporal && (
        <div className="administracion__modal-fondo" role="presentation">
          <section className="administracion__modal" role="dialog" aria-modal="true">
            <h2>Contraseña temporal</h2>
            <p>Mostrala o copiala ahora. No podrás volver a verla después de cerrar este mensaje.</p>
            <code className="administracion__password-temporal">{passwordTemporal}</code>
            <p>El usuario deberá cambiarla en su próximo ingreso.</p>
            <div className="administracion__modal-acciones">
              <button
                type="button"
                className="administracion__modal-confirmar"
                onClick={copiarPasswordTemporal}
              >
                {passwordCopiada ? 'Copiada' : 'Copiar contraseña'}
              </button>
              <button
                type="button"
                className="administracion__modal-cancelar"
                onClick={() => setPasswordTemporal('')}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </AuthLayout>
  );
}

export default EditarUsuarioAdministrador;
