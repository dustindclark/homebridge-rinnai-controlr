export const fahrenheitToCelsius = (fValue: number): number => {
    return (fValue - 32) / 1.8;
};

export const celsiusToFahrenheit = (cValue: number): number => {
    return cValue * 1.8 + 32;
};