import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Login.css';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/useAuth';
import { mensajeDelServidor } from '../services/password';

// CU05 4.a: cada error del servidor tiene su propio mensaje.
function mensajeDeError(err) {
  if (!err.response) {
    return 'No se pudo conectar con el servidor';
  }

  const { status, data } = err.response;

  switch (data?.error) {
    case 'USUARIO_BLOQUEADO':
      return data.mensaje;
    case 'EMAIL_NO_VERIFICADO':
      return 'Tenés que verificar tu email antes de ingresar.';
    case 'USUARIO_NO_ACTIVO':
      return 'Tu cuenta no está activa. Contactá a un administrador de TUMO.';
    case 'DATOS_INVALIDOS':
      return mensajeDelServidor(err) || 'Revisá los datos ingresados';
    case 'DEMASIADAS_SOLICITUDES':
      return data.mensaje;
    default:
      return status === 401
        ? 'Email o contraseña incorrectos'
        : 'No se pudo iniciar sesión. Intentá de nuevo.';
  }
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [sinVerificar, setSinVerificar] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSinVerificar(false);
    setCargando(true);

    try {
      await login(email, password);
      navigate(location.state?.desde || '/inicio', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
      setSinVerificar(err.response?.data?.error === 'EMAIL_NO_VERIFICADO');
      setCargando(false);
    }
  }

  return (
    <main className="auth">
      <header className="auth__encabezado">
        <div className="auth__logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
        <h1 className="auth__titulo">TUMO<span>NET</span></h1>
        <p className="auth__subtitulo">La comunidad de TUMO Montevideo</p>
      </header>

      <form className="auth__form" onSubmit={handleSubmit}>
        <Input
          label="Email"
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Contraseña"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Link to="/forgot-password" className="auth__link">¿Olvidaste tu contraseña?</Link>
        {error && <p className="auth__error" role="alert">{error}</p>}
        {sinVerificar && (
          <Link
            to="/alta"
            state={{ verificarEmail: email }}
            className="auth__enlace"
          >
            Ingresar el código de verificación
          </Link>
        )}
        <button type="submit" className="auth__boton" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
        <p className="auth__pie">
          ¿No tenés cuenta?{' '}
          <Link to="/alta" className="auth__enlace">Registrate</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
