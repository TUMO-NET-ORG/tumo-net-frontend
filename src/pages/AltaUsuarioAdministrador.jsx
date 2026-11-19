import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/Input.jsx';
import { crearUsuarioAdministrador } from '../services/usuariosService.js';
import { MENSAJE_CEDULA, cedulaValida } from '../services/cedula.js';
import { mensajeDelServidor } from '../services/password.js';

const ROLES = [
  ['administrador', 'Administrador'],
  ['alumno', 'Alumno'],
  ['staff', 'Staff'],
  ['tutor', 'Tutor'],
];

const FORMULARIO_INICIAL = {
  nombre: '',
  apellido: '',
  documento: '',
  email: '',
  fechaNacimiento: '',
  urlPortfolio: '',
  rol: 'alumno',
};

function fechaActualLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function AltaUsuarioAdministrador() {
  const [form, setForm] = useState(FORMULARIO_INICIAL);
  const [creado, setCreado] = useState(null);
  const [error, setError] = useState('');
  const [erroresCampos, setErroresCampos] = useState([]);
  const [cargando, setCargando] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'fechaNacimiento' && value && value > fechaActualLocal()) {
      return;
    }
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  function validarFormulario() {
    if (!cedulaValida(form.documento)) {
      return MENSAJE_CEDULA;
    }
    if (form.fechaNacimiento && form.fechaNacimiento > fechaActualLocal()) {
      return 'La fecha de nacimiento no puede ser posterior a hoy';
    }
    return '';
  }

  async function handleCrear(event) {
    event.preventDefault();
    setError('');
    setErroresCampos([]);

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await crearUsuarioAdministrador({
        nombre: form.nombre,
        apellido: form.apellido,
        documento: form.documento,
        email: form.email,
        fechaNacimiento: form.fechaNacimiento || null,
        urlPortfolio: form.urlPortfolio || null,
        rol: form.rol,
      });
      setCreado(respuesta.usuario);
      setForm(FORMULARIO_INICIAL);
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor');
      } else if (err.response.status === 403) {
        setError('No tenés permisos para crear usuarios');
      } else if (err.response.status === 409) {
        setError(
          err.response.data?.error === 'EMAIL_DUPLICADO'
            ? 'Ya existe un usuario con ese email'
            : 'Ya existe un usuario con esa cédula',
        );
      } else if (err.response.data?.error === 'INVITACION_NO_ENVIADA') {
        setError(
          'La cuenta quedó pendiente, pero no se pudo enviar el enlace. '
          + 'Podés corregir el email y reenviar la invitación.',
        );
      } else if (err.response.data?.error === 'DATOS_INVALIDOS') {
        setErroresCampos(err.response.data.detalles || []);
        setError(mensajeDelServidor(err) || 'Revisá los datos ingresados');
      } else {
        setError('No se pudo crear el usuario. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  function mensajeCampo(nombre) {
    return erroresCampos.find((detalle) => detalle.campo === nombre)?.mensaje;
  }

  if (creado) {
    return (
      <AuthLayout amplio>
        <header className="auth__encabezado">
          <h1 className="auth__titulo">Usuario creado</h1>
          <p className="auth__subtitulo">
            Se creó la cuenta de {creado.nombre} {creado.apellido}.
          </p>
        </header>
        <p className="mensaje-exito">
          Se envió un enlace a {creado.email}. La cuenta quedará activa cuando la
          persona verifique su email, acepte los términos y defina su contraseña.
        </p>
        <button
          type="button"
          className="auth__boton"
          onClick={() => setCreado(null)}
        >
          Crear otro usuario
        </button>
        <Link to="/inicio" className="auth__volver">Volver al inicio</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout amplio>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Alta de usuario</h1>
        <p className="auth__subtitulo">
          Creá una cuenta individual y asignale un rol.
        </p>
      </header>

      <form className="auth__form" onSubmit={handleCrear}>
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
            <p id="documento-ayuda" className="auth__ayuda">Sin puntos ni guiones</p>
          </div>
          <div className="auth__campo">
            <Input label="Fecha de nacimiento" id="fechaNacimiento" name="fechaNacimiento"
              type="date" value={form.fechaNacimiento} onChange={handleChange}
              max={fechaActualLocal()} />
          </div>
        </div>

        <Input label="Email *" id="email" name="email" type="email"
          value={form.email} onChange={handleChange} required />
        {mensajeCampo('email') && <p className="auth__error">{mensajeCampo('email')}</p>}

        <div className="auth__campo">
          <label htmlFor="rol" className="auth__label">Rol *</label>
          <select id="rol" name="rol" className="auth__select"
            value={form.rol} onChange={handleChange} required>
            {ROLES.map(([clave, nombre]) => (
              <option key={clave} value={clave}>{nombre}</option>
            ))}
          </select>
          {mensajeCampo('rol') && <p className="auth__error">{mensajeCampo('rol')}</p>}
        </div>

        <Input label="Portfolio" id="urlPortfolio" name="urlPortfolio" type="url"
          placeholder="https://" value={form.urlPortfolio}
          onChange={handleChange} maxLength={500} />
        {mensajeCampo('urlPortfolio') && (
          <p className="auth__error">{mensajeCampo('urlPortfolio')}</p>
        )}

        {error && <p className="auth__error">{error}</p>}

        <button type="submit" className="auth__boton" disabled={cargando}>
          {cargando ? 'Creando usuario...' : 'Crear usuario'}
        </button>
      </form>

      <Link to="/inicio" className="auth__volver">Volver al inicio</Link>
    </AuthLayout>
  );
}

export default AltaUsuarioAdministrador;
