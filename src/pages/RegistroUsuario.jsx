import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/Input.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { registrar, reenviarCodigo, verificarCodigo } from '../services/usuariosService.js';
import {MENSAJE_CEDULA, cedulaValida} from '../services/cedula.js';
import { LARGO_MINIMO_PASSWORD, MENSAJE_PASSWORD, mensajeDelServidor, passwordValida } from '../services/password';

const VERSION_TERMINOS = '1.0';

function Registro() {
  // Desde el login se puede llegar directo al paso del código
  // con un usuario que todavía no verificó su email.
  const emailPendiente = useLocation().state?.verificarEmail;

  // 'formulario' → 'codigo' → 'listo'
  const [paso, setPaso] = useState(emailPendiente ? 'codigo' : 'formulario');

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    email: emailPendiente || '',
    password: '',
    confirmacion: '',
    fechaNacimiento: '',
    urlPortfolio: '',
    aceptaTerminos: false,
  });
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  // El aviso aparece recién cuando se escribió algo en la confirmación y no coincide.
  const confirmacionDistinta = form.confirmacion !== '' && form.confirmacion !== form.password;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  // Paso 1: enviar los datos. El backend crea el usuario y manda el código por mail.
  async function handleRegistro(e) {
    e.preventDefault();
    setError('');

    if (!cedulaValida(form.documento)) {
      setError(MENSAJE_CEDULA);
      return;
    }

    if (!passwordValida(form.password)) {
      setError(MENSAJE_PASSWORD);
      return;
    }
    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!form.aceptaTerminos) {
      setError('Es necesario aceptar los términos y condiciones');
      return;
    }

    setCargando(true);

    try {
      await registrar({
        nombre: form.nombre,
        apellido: form.apellido,
        documento: form.documento,
        email: form.email,
        password: form.password,
        fechaNacimiento: form.fechaNacimiento || null,
        urlPortfolio: form.urlPortfolio || null,
        aceptaTerminos: true,
        versionTerminos: VERSION_TERMINOS,
      });
      setPaso('codigo');
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor');
      } else if (err.response.data?.error === 'USUARIO_DUPLICADO') {
        setError('Ya existe una cuenta con ese email o documento');
      } else if (err.response.data?.error === 'DATOS_INVALIDOS') {
        setError(mensajeDelServidor(err) || 'Revisá los datos ingresados');
      } else if (err.response.data?.error === 'EMAIL_VERIFICACION_NO_ENVIADO') {
        // La cuenta quedó creada pero el mail no salió: se puede reenviar.
        setPaso('codigo');
        setError('Tu cuenta se creó, pero no pudimos enviarte el código. Tocá "Reenviar código".');
      } else {
        setError('No se pudo completar el registro. Intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  // Paso 2: verificar el código que llegó por mail.
  async function handleCodigo(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await verificarCodigo(form.email, codigo.trim());
      setPaso('listo');
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor');
      } else if (err.response.data?.error === 'CODIGO_VENCIDO') {
        setError('El código venció. Tocá "Reenviar código" para recibir uno nuevo.');
      } else if (err.response.data?.error === 'VERIFICACION_BLOQUEADA') {
        setError('Superaste los intentos permitidos. Tocá "Reenviar código" para recibir uno nuevo.');
      } else {
        setError('El código no es correcto. Revisalo e intentá de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  async function handleReenviar() {
    setError('');
    setAviso('');
    setCargando(true);

    try {
      await reenviarCodigo(form.email);
      setCodigo('');
      setAviso('Si tu cuenta está pendiente de verificación, te enviamos un código nuevo.');
    } catch (err) {
      setError(
        err.response?.data?.error === 'DEMASIADAS_SOLICITUDES'
          ? err.response.data.mensaje
          : 'No se pudo reenviar el código. Intentá de nuevo en un minuto.',
      );
    } finally {
      setCargando(false);
    }
  }

  if (paso === 'listo') {
    return (
      <AuthLayout>
        <header className="auth__encabezado">
          <h1 className="auth__titulo">¡Cuenta creada!</h1>
          <p className="auth__subtitulo">Tu cuenta se creó correctamente. Ya podés iniciar sesión.</p>
        </header>
        <Link to="/login" className="auth__boton">Ir a iniciar sesión</Link>
      </AuthLayout>
    );
  }

  if (paso === 'codigo') {
    return (
      <AuthLayout>
        <header className="auth__encabezado">
          <p className="auth__subtitulo">
            Te enviamos un código a <strong>{form.email}</strong>. Escribilo acá para confirmar tu cuenta.
            Si no lo ves, revisá la carpeta de spam.
          </p>
        </header>

        <form className="auth__form" onSubmit={handleCodigo}>
          <Input
            label="Código"
            id="codigo"
            name="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoComplete="one-time-code"
            required
          />

          {aviso && <p className="mensaje-exito">{aviso}</p>}
          {error && <p className="auth__error">{error}</p>}

          <button type="submit" className="auth__boton" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Confirmar cuenta'}
          </button>
          <button
            type="button"
            className="auth__link"
            onClick={handleReenviar}
            disabled={cargando}
          >
            Reenviar código
          </button>
        </form>

        <p className="auth__pie">
          <Link to="/login" className="auth__enlace">Ir a iniciar sesión</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout amplio>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Crear cuenta</h1>
        <p className="auth__subtitulo">Completá tus datos para registrarte.</p>
      </header>

      <form className="auth__form" onSubmit={handleRegistro}>
        {/* auth__fila: dos columnas desde 768px, una sola en el celular */}
        <div className="auth__fila">
          <div className="auth__campo">
            <Input label="Nombre *" id="nombre" name="nombre"
              value={form.nombre} onChange={handleChange} maxLength={100} required />
          </div>
          <div className="auth__campo">
            <Input label="Apellido *" id="apellido" name="apellido"
              value={form.apellido} onChange={handleChange} maxLength={100} required />
          </div>
        </div>

        <div className="auth__fila">
          <div className="auth__campo">
            <Input label="Cédula de identidad *" id="documento" name="documento"
              value={form.documento} onChange={handleChange} maxLength={20} required
              aria-describedby="documento-ayuda" />
            <p id="documento-ayuda" className="auth__ayuda">Sin puntos ni guiones</p>
          </div>
          <div className="auth__campo">
            <Input label="Fecha de nacimiento" id="fechaNacimiento" name="fechaNacimiento" type="date"
              value={form.fechaNacimiento} onChange={handleChange} />
          </div>
        </div>
        <div className="auth__campo">
          <Input label="Email *" id="email" name="email" type="email"
            value={form.email} placeholder="tu.email@tumo.world" onChange={handleChange} required
            aria-describedby="email-ayuda" />
          <p id="email-ayuda" className="auth__ayuda">Utilizá tu cuenta institucional @tumo.world o @tumo.uy</p>
        </div>

        <div className="auth__fila">
          <div className="auth__campo">
            <PasswordInput label="Contraseña *" id="password" name="password" type="password"
              autoComplete="new-password" minLength={LARGO_MINIMO_PASSWORD} title={MENSAJE_PASSWORD}
              value={form.password} onChange={handleChange} required
              aria-describedby="password-ayuda" />
            <p id="password-ayuda" className="auth__ayuda">{MENSAJE_PASSWORD}</p>
          </div>
          <div className="auth__campo">
            <PasswordInput label="Repetí la contraseña" id="confirmacion" name="confirmacion" type="password"
              value={form.confirmacion} onChange={handleChange} required
              aria-invalid={confirmacionDistinta}
              aria-describedby={confirmacionDistinta ? 'confirmacion-ayuda' : undefined} />
            {confirmacionDistinta && (
              <p id="confirmacion-ayuda" className="auth__ayuda auth__ayuda--error">
                Las contraseñas no coinciden
              </p>
            )}
          </div>
        </div>

        <Input label="Portfolio" id="urlPortfolio" name="urlPortfolio" type="url"
          placeholder="https://..."
          value={form.urlPortfolio} onChange={handleChange} maxLength={500} />

        <label className="auth__check">
          <input
            type="checkbox"
            name="aceptaTerminos"
            checked={form.aceptaTerminos}
            onChange={handleChange}
          />
          Acepto los términos y condiciones
        </label>

        {error && <p className="auth__error">{error}</p>}

        <button type="submit" className="auth__boton" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <p className="auth__pie">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="auth__enlace">Iniciá sesión</Link>
      </p>
    </AuthLayout>
  );
}

export default Registro;
