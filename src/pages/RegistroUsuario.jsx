import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Input from '../components/Input';
import { registrar, reenviarCodigo, verificarCodigo } from '../services/usuariosService.js';
import { MENSAJE_PASSWORD, mensajeDelServidor, passwordValida } from '../services/password';

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

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  // Paso 1: enviar los datos. El backend crea el usuario y manda el código por mail.
  async function handleRegistro(e) {
    e.preventDefault();
    setError('');

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
      <main className="auth">
        <header className="auth__encabezado">
          <h1 className="auth__titulo">¡Cuenta creada!</h1>
          <p className="auth__subtitulo">Tu cuenta se creó correctamente. Ya podés iniciar sesión.</p>
        </header>
        <Link to="/login" className="auth__boton">Ir a iniciar sesión</Link>
      </main>
    );
  }

  if (paso === 'codigo') {
    return (
      <main className="auth">
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
      </main>
    );
  }

  return (
    <main className="auth">
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Crear cuenta</h1>
        <p className="auth__subtitulo">Completá tus datos para registrarte.</p>
      </header>

      <form className="auth__form" onSubmit={handleRegistro}>
        <Input label="Nombre" id="nombre" name="nombre"
          value={form.nombre} onChange={handleChange} maxLength={100} required />

        <Input label="Apellido" id="apellido" name="apellido"
          value={form.apellido} onChange={handleChange} maxLength={100} required />

        <Input label="Documento" id="documento" name="documento"
          value={form.documento} onChange={handleChange} maxLength={20} required />

        <Input label="Email" id="email" name="email" type="email"
          value={form.email} onChange={handleChange} required />

        <Input label="Contraseña" id="password" name="password" type="password"
          autoComplete="new-password" minLength={10} title={MENSAJE_PASSWORD}
          value={form.password} onChange={handleChange} required />

        <Input label="Repetí la contraseña" id="confirmacion" name="confirmacion" type="password"
          value={form.confirmacion} onChange={handleChange} required />

        <Input label="Fecha de nacimiento (opcional)" id="fechaNacimiento" name="fechaNacimiento" type="date"
          value={form.fechaNacimiento} onChange={handleChange} />

        <Input label="Portfolio (opcional)" id="urlPortfolio" name="urlPortfolio" type="url"
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
    </main>
  );
}

export default Registro;
