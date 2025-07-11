/**
 * Formatea un precio como número con máximo 4 decimales
 * @param price - El precio a formatear
 * @returns El precio formateado como string
 */
export function formatPrice(price: number): string {
  if (isNaN(price) || price === null || price === undefined) {
    return "0";
  }

  // Convertir a número por seguridad
  const numPrice = Number(price);

  // Si es cero, devolver "0"
  if (numPrice === 0) {
    return "0";
  }

  // Si es menor que 0.0001, mostrar notación científica
  if (numPrice < 0.0001) {
    return numPrice.toExponential(2);
  }

  // Determinar el número de decimales según el tamaño del número
  let decimales = 2;

  if (numPrice < 0.01) {
    decimales = 4;
  } else if (numPrice < 0.1) {
    decimales = 3;
  }

  // Usar toFixed para formatear con el número correcto de decimales
  // y eliminar ceros finales innecesarios
  return numPrice.toFixed(decimales).replace(/\.?0+$/, "");
}
