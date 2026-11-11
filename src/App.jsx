import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
import { RutaProtegida, RutaPublica } from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import OlvideContrasena from './pages/OlvideContrasena.jsx';
import RecuperarContrasena from './pages/RecuperarContrasena.jsx';
import RegistroUsuario from './pages/RegistroUsuario.jsx';
import Inicio from './pages/Inicio.jsx';

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

          <Route element={<RutaProtegida />}>
            <Route path="/inicio" element={<Inicio />} />
          </Route>

          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
