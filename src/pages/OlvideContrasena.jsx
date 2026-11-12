import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitarRecuperacion } from '../services/authService';
import Input from '../components/Input.jsx';
import './auth.css';

function OlvideContrasena() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await solicitarRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      if (err.response) {
        setError('No pudimos procesar la solicitud. Intentá de nuevo.');
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="auth">
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Recuperar contraseña</h1>
        {!enviado && (
          <p className="auth__subtitulo">
            Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        )}
      </header>

      {enviado ? (
        <p className="auth__exito">
          Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.
          Revisá tu bandeja de entrada y la carpeta de spam.
        </p>
      ) : (
        <form className="auth__form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="auth__error">{error}</p>}

          <button type="submit" className="auth__boton" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      )}

      <Link to="/login" className="auth__volver">Volver a iniciar sesión</Link>
    </main>
  );
}

export default OlvideContrasena;