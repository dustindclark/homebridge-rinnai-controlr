import {fahrenheitToCelsius, celsiusToFahrenheit} from '../src/util';


describe('Fahrenheit to Celsius', () => {
  it('SendResultFailedRatio', () => {
    const result = fahrenheitToCelsius(140);
    expect(result).toEqual(60);
  });
});

describe('Celsius to Fahrenheit', () => {
  it('SendResultFailedRatio', () => {
    const result = celsiusToFahrenheit(60);
    expect(result).toEqual(140);
  });
});