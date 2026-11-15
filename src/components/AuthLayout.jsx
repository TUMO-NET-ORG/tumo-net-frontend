import { DISCIPLINAS } from '../data/feedEjemplo';
import '../pages/Login.css';

// Marco común de las pantallas de acceso (login, registro y recuperación).
// En el celular muestra solo el formulario; desde 768px el formulario va en
// una tarjeta y desde 1024px se suma el panel de marca a la izquierda.
function AuthLayout({ children, amplio = false }) {
  return (
    <div className="auth-layout">
      <section className="auth-layout__marca" aria-label="Sobre TUMO NET">
        <p className="auth-layout__logo">
          TUMO<span>NET</span>
        </p>
        <h2 className="auth-layout__titulo">Compartí lo que creás en TUMO</h2>
        <p className="auth-layout__texto">
          Mostrá tus proyectos, descubrí lo que hacen en otros talleres y enterate de las
          novedades del centro.
        </p>
        <ul className="auth-layout__disciplinas">
          {Object.values(DISCIPLINAS).map((d) => (
            <li key={d.nombre}>{d.nombre}</li>
          ))}
        </ul>
      </section>

      <div className="auth-layout__formulario">
        <main className={`auth ${amplio ? 'auth--amplio' : ''}`}>{children}</main>
      </div>
    </div>
  );
}

export default AuthLayout;
