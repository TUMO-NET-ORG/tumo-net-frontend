import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
import { RutaAdministrador, RutaProtegida, RutaPublica } from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import OlvideContrasena from './pages/OlvideContrasena.jsx';
import RecuperarContrasena from './pages/RecuperarContrasena.jsx';
import RegistroUsuario from './pages/RegistroUsuario.jsx';
import Inicio from './pages/Inicio.jsx';
import AltaUsuarioAdministrador from './pages/AltaUsuarioAdministrador.jsx';
import AdministrarUsuarios from './pages/AdministrarUsuarios.jsx';
import EditarUsuarioAdministrador from './pages/EditarUsuarioAdministrador.jsx';
import ConfirmarCambioEmail from './pages/ConfirmarCambioEmail.jsx';
import CambiarContrasena from './pages/CambiarContrasena.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RutaPublica />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<OlvideContrasena />} />
            <Route path="/alta" element={<RegistroUsuario />} />
          </Route>

          {/* Accesible con o sin sesión: se llega desde el enlace del mail */}
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/establecer-contrasena" element={<RecuperarContrasena />} />
          <Route path="/verificar-email" element={<ConfirmarCambioEmail />} />

          <Route element={<RutaProtegida />}>
            <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
            <Route path="/inicio" element={<Inicio />} />

            <Route element={<RutaAdministrador />}>
              <Route
                path="/administracion/usuarios"
                element={<AdministrarUsuarios />}
              />
              <Route
                path="/administracion/usuarios/nuevo"
                element={<AltaUsuarioAdministrador />}
              />
              <Route
                path="/administracion/usuarios/:id/editar"
                element={<EditarUsuarioAdministrador />}
              />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
