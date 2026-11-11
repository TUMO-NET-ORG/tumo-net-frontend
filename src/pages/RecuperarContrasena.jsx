import { useState } from 'react';
import { Link } from 'react-router-dom';
import { restablecerPassword } from '../services/authService.js';
import Input from '../components/Input.jsx';
import { MENSAJE_PASSWORD, mensajeDelServidor, passwordValida } from '../services/password';
import './Login.css';

function RecuperarContrasena() {
  const [token] = useState(() => {
    const tokenParam = new URLSearchParams(window.location.hash.slice(1)).get(
      'token',
    );

    if (tokenParam) {
      window.history.replaceState(
        null,
        document.title,
        `${window.location.pathname}${window.location.search}`,
      );
    }

    return tokenParam;
  });

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!passwordValida(password)) {
      setError(MENSAJE_PASSWORD);
      return;
    }

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      await restablecerPassword(token, password);
      setListo(true);
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar con el servidor');
      } else if (err.response.data?.error === 'DATOS_INVALIDOS') {
        setError(mensajeDelServidor(err) || MENSAJE_PASSWORD);
      } else {
        setError('El enlace venció o ya fue usado. Pedí uno nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <main className="auth">
        <header className="auth__encabezado">
          <h1 className="auth__titulo">Enlace inválido</h1>
          <p className="auth__subtitulo">
            El enlace no es válido. Pedí uno nuevo para recuperar tu contraseña.
          </p>
        </header>
        <Link to="/forgot-password" className="auth__boton">Pedir un enlace nuevo</Link>
      </main>
    );
  }

  if (listo) {
    return (
      <main className="auth">
        <header className="auth__encabezado">
          <h1 className="auth__titulo">¡Listo!</h1>
          <p className="mensaje-exito">Tu contraseña se actualizó correctamente.</p>
        </header>
        <Link to="/login" className="auth__boton">Iniciar sesión</Link>
      </main>
    );
  }

  return (
    <main className="auth">
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Nueva contraseña</h1>
        <p className="auth__subtitulo">Elegí una contraseña nueva para tu cuenta.</p>
        <p className="auth__subtitulo">{MENSAJE_PASSWORD}.</p>
      </header>

      <form className="auth__form" onSubmit={handleSubmit}>

        <Input
          label="Nueva contraseña"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Repetí la contraseña"
          id="confirmacion"
          type="password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          required
        />

        {error && <p className="auth__error">{error}</p>}

        <button type="submit" className="auth__boton" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>

      <Link to="/forgot-password" className="auth__volver">Pedir un enlace nuevo</Link>
    </main>
  );
}

export default RecuperarContrasena;