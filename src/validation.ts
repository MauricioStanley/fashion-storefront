export function emailError(value: string) {
  const email = value.trim();
  if (!email) return "Nos falta tu correo. Escríbelo para continuar.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Revisa el formato de tu correo. Prueba con nombre@ejemplo.com.";
  return "";
}

export function chestError(value: string) {
  if (!value.trim()) return "Nos falta tu medida. Escríbela en centímetros.";
  const number = Number(value.replace(",", "."));
  if (
    !/^\d{2,3}([.,]\d{1,2})?$/.test(value.trim()) ||
    number < 72 ||
    number > 124
  )
    return "Introduce un contorno de pecho entre 72 y 124 cm. Por ejemplo, 96.";
  return "";
}
