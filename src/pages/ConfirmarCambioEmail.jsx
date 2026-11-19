import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { confirmarCambioEmail } from '../services/authService.js';

function ConfirmarCambioEmail() {
  const [token] = useState(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (token) {
      window.history.replaceState(
        null,
        document.title,
        `${window.location.pathname}${window.location.search}`,
      );
    }
    return token;
  });
  const [resultado, setResultado] = useState(null);
  const confirmacionIniciada = useRef(false);

  useEffect(() => {
    if (!token || confirmacionIniciada.current) return;
    confirmacionIniciada.current = true;
    confirmarCambioEmail(token)
      .then(() => setResultado('ok'))
      .catch(() => setResultado('error'));
  }, [token]);

  if (resultado === 'ok') {
    return (
      <AuthLayout>
        <header className="auth__encabezado">
          <h1 className="auth__titulo">Email actualizado</h1>
          <p className="mensaje-exito">La nueva dirección fue confirmada correctamente.</p>
        </header>
        <Link to="/login" className="auth__boton">Ir al inicio de sesión</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">
          {resultado === 'error' || !token ? 'Enlace inválido' : 'Confirmando email…'}
        </h1>
        {(resultado === 'error' || !token) && (
          <p className="auth__subtitulo">El enlace venció o ya fue utilizado.</p>
        )}
      </header>
      {resultado === 'error' && (
        <Link to="/login" className="auth__boton">Volver al inicio</Link>
      )}
    </AuthLayout>
  );
}

export default ConfirmarCambioEmail;
