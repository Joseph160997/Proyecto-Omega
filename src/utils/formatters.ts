/**
 * Formatea un número como moneda USD.
 * @param value El número a formatear.
 * @returns El número formateado como moneda.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

/**
 * Formatea el porcentaje de cambio con simbolo y dos decimales.
 * @param value El número a formatear.
 * @returns El número formateado como porcentaje.
 */
export const formatPercentage = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  // Aseguramos que el valor se muestre con dos decimales y el símbolo de porcentaje al final
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};
