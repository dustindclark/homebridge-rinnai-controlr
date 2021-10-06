export const fahrenheitToCelsius = (fValue: number): number => {
  return (fValue - 32) * 5/9;
};

export const celsiusToFahrenheit = (cValue: number): number => {
  return cValue * 9/5 + 32;
};