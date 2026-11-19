import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/useAuth';
import { cambiarPassword } from '../services/authService.js';
import { mensajeDelServidor } from '../services/password.js';

function CambiarContrasena() {
  const navigate = useNavigate();
  const { usuario, actualizarSesion } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (nuevaPassword !== confirmacion) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await cambiarPassword(passwordActual, nuevaPassword);
      actualizarSesion(resultado.token, {
        ...usuario,
        debeCambiarPassword: false,
      });
      navigate('/inicio', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error === 'PASSWORD_ACTUAL_INCORRECTA'
          ? 'La contraseña actual es incorrecta'
          : err.response?.data?.error === 'DATOS_INVALIDOS'
            ? mensajeDelServidor(err) || 'Revisá los datos ingresados'
            : 'No se pudo actualizar la contraseña',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AuthLayout>
      <header className="auth__encabezado">
        <h1 className="auth__titulo">Cambiar contraseña</h1>
        <p className="auth__subtitulo">
          Por seguridad, tenés que cambiar tu contraseña antes de continuar.
        </p>
      </header>

      <form className="auth__form" onSubmit={handleSubmit}>
        <Input
          label="Contraseña actual"
          id="passwordActual"
          type="password"
          value={passwordActual}
          onChange={(event) => setPasswordActual(event.target.value)}
          required
        />
        <Input
          label="Nueva contraseña"
          id="nuevaPassword"
          type="password"
          value={nuevaPassword}
          onChange={(event) => setNuevaPassword(event.target.value)}
          required
        />
        <Input
          label="Repetir nueva contraseña"
          id="confirmacion"
          type="password"
          value={confirmacion}
          onChange={(event) => setConfirmacion(event.target.value)}
          required
        />

        {error && <p className="auth__error" role="alert">{error}</p>}

        <button type="submit" className="auth__boton" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default CambiarContrasena;
