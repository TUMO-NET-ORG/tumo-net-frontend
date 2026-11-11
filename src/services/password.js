// Debe coincidir con backend/src/server/v1/validators/password.validator.js (RNF07)
export const LARGO_MINIMO_PASSWORD = 10;
export const MENSAJE_PASSWORD = `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres y un número`;

export function passwordValida(password) {
  return password.length >= LARGO_MINIMO_PASSWORD && /\d/.test(password);
}

// Devuelve el primer mensaje de validación que mandó el backend, si hay.
export function mensajeDelServidor(err) {
  return err?.response?.data?.detalles?.[0]?.mensaje || err?.response?.data?.mensaje;
}
