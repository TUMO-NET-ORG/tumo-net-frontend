// Íconos de línea simples (sin dependencias externas).
const TRAZOS = {
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  campana: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  inicio: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  mas: <path d="M12 5v14M5 12h14" />,
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  corazon: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  ),
  comentario: <path d="M4 5h16v11H9l-5 4z" />,
  salir: (
    <>
      <path d="M15 4h4v16h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  megafono: (
    <>
      <path d="M4 10v4h3l7 4V6L7 10z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>
  ),
};

function Icono({ nombre, relleno = false, tamano = 24 }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

export default Icono;
