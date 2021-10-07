import {CharacteristicValue, Nullable, PlatformAccessory, Service} from 'homebridge';

import {RinnaiControlrHomebridgePlatform} from './platform';
import {
  API_KEY_RECIRCULATION_DURATION,
  API_KEY_SET_PRIORITY_STATUS, API_KEY_SET_RECIRCULATION_ENABLED,
  API_KEY_SET_TEMPERATURE,
  API_VALUE_FALSE,
  API_VALUE_TRUE,
  MANUFACTURER,
  SET_STATE_WAIT_TIME_MILLIS,
  TemperatureUnits, THERMOSTAT_STEP_VALUE,
  UNKNOWN,
} from './constants';
import {celsiusToFahrenheit, fahrenheitToCelsius} from './util';

const RECIRC_SERVICE_NAME = 'Recirculation';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RinnaiControlrPlatformAccessory {
  private service: Service;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any;
  private readonly isFahrenheit: boolean;
  private readonly minValue: number;
  private readonly maxValue: number;
  private temperature: number;

  constructor(
    private readonly platform: RinnaiControlrHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.device = this.accessory.context;

    this.platform.log.debug(`Setting accessory details for device: ${JSON.stringify(this.device, null, 2)}`);
    this.isFahrenheit = this.platform.getConfig().temperatureUnits === TemperatureUnits.F;

    this.minValue = this.platform.getConfig().minimumTemperature;
    this.maxValue = this.platform.getConfig().maximumTemperature;
    if (this.isFahrenheit) {
      this.minValue = fahrenheitToCelsius(this.minValue);
      this.maxValue = fahrenheitToCelsius(this.maxValue);
    }

    this.temperature = this.isFahrenheit && this.device.info?.domestic_temperature
      ? fahrenheitToCelsius(this.device.info.domestic_temperature)
      : this.device.info.domestic_temperature;

    this.platform.log.debug(`Temperature Slider Min: ${this.minValue}, Max: ${this.maxValue}, ` +
        `current temperature: ${this.temperature}`);

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || UNKNOWN)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.dsn || UNKNOWN);

    this.service = this.accessory.getService(this.platform.Service.Thermostat)
        || this.accessory.addService(this.platform.Service.Thermostat);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.device_name);

    this.bindTemperature();
    this.bindRecirculation();
    this.bindStaticValues();
  }

  bindTemperature() {
    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this.setTemperature.bind(this))
      .onGet(this.getTemperature.bind(this))
      .setProps({
        minValue: this.minValue,
        maxValue: this.maxValue,
        minStep: THERMOSTAT_STEP_VALUE,
      })
      .updateValue(this.temperature);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getTemperature.bind(this))
      .updateValue(this.temperature)
      .setProps({
        minValue: this.minValue,
        maxValue: this.maxValue,
        minStep: THERMOSTAT_STEP_VALUE,
      });

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .updateValue(this.platform.Characteristic.TargetHeatingCoolingState.HEAT)
      .setProps({
        minValue: this.platform.Characteristic.TargetHeatingCoolingState.HEAT,
        maxValue: this.platform.Characteristic.TargetHeatingCoolingState.HEAT,
        validValues: [this.platform.Characteristic.TargetHeatingCoolingState.HEAT],
      });
  }

  bindRecirculation() {
    if (this.accessory.context.info?.recirculation_capable === API_VALUE_TRUE) {
      this.platform.log.debug(`Device ${this.device.dsn} has recirculation capabilities. Adding service.`);
      const recircService = this.accessory.getService(RECIRC_SERVICE_NAME) ||
          this.accessory.addService(this.platform.Service.Switch, RECIRC_SERVICE_NAME, `${this.device.dsn}-Recirculation`);
      recircService.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setRecirculateActive.bind(this));
      recircService.updateCharacteristic(this.platform.Characteristic.On,
        this.device.shadow.recirculation_enabled);
    } else {
      this.platform.log.debug(`Device ${this.device.dsn} does not support recirculation.`);
    }
  }

  bindStaticValues() {
    this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits,
      this.platform.getConfig().temperatureUnits === TemperatureUnits.F
        ? this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT
        : this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState,
      this.platform.Characteristic.CurrentHeatingCoolingState.HEAT);
  }

  async setRecirculateActive(value: CharacteristicValue) {
    this.platform.log.debug(`setRecirculateActive to ${value} for device ${this.device.dsn}`);
    await this.platform.setState(this.accessory, API_KEY_SET_PRIORITY_STATUS, API_VALUE_TRUE);
    if (value as boolean) {
      await this.platform.setState(this.accessory, API_KEY_RECIRCULATION_DURATION, `${this.platform.getConfig().recirculationDuration}`);
      await this.platform.setState(this.accessory, API_KEY_SET_RECIRCULATION_ENABLED, API_VALUE_TRUE);
    } else {
      await this.platform.setState(this.accessory, API_KEY_RECIRCULATION_DURATION, '0');
      await this.platform.setState(this.accessory, API_KEY_SET_RECIRCULATION_ENABLED, API_VALUE_FALSE);
    }
  }

  async setTemperature(value: CharacteristicValue) {
    this.platform.log.debug(`setTemperature to ${value} for device ${this.device.dsn}`);

    const convertedValue : number = this.isFahrenheit
      ? Math.round(celsiusToFahrenheit(value as number)/5) * 5 // Round to nearest 5
      : value as number;

    this.platform.log.debug('Sending converted/rounded temperature: ${convertedValue}');

    await this.platform.setState(this.accessory, API_KEY_SET_PRIORITY_STATUS, API_VALUE_TRUE);
    await this.platform.setState(this.accessory, API_KEY_SET_TEMPERATURE, `${convertedValue}`);
    setTimeout(() => {
      this.platform.throttledPoll();
    }, SET_STATE_WAIT_TIME_MILLIS);
    this.temperature = this.isFahrenheit ? fahrenheitToCelsius(convertedValue) : convertedValue;
  }

  async getTemperature(): Promise<Nullable<CharacteristicValue>> {
    this.platform.throttledPoll();
    return this.temperature;
  }
}
