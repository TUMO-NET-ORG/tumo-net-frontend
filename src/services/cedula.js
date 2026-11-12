const MULTIPLICADORES = [2, 9, 8, 7, 6, 3, 4];

export const MENSAJE_CEDULA = 'La cédula no es válida. Revisá que esté bien escrita, sin puntos ni guiones.';

export function cedulaValida(cedula) {
  if (!/^\d{7,8}$/.test(cedula)) return false;

  const digitos = cedula.padStart(8, '0');
  const suma = MULTIPLICADORES.reduce((total, peso, i) => total + Number(digitos[i]) * peso, 0);
  const verificador = (10 - (suma % 10)) % 10;

  return verificador === Number(digitos[7]);
}