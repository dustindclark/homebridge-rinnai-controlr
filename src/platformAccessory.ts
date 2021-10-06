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
  TemperatureUnits,
  THERMOSTAT_STEP_VALUE, UNKNOWN,
} from './constants';
import {celsiusToFahrenheit, fahrenheitToCelsius} from './util';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RinnaiControlrPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: RinnaiControlrHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    const device = this.accessory.context;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, device.model || UNKNOWN)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.dsn || UNKNOWN);

    this.service = this.accessory.getService(this.platform.Service.HeaterCooler)
        || this.accessory.addService(this.platform.Service.HeaterCooler);
    this.service.setCharacteristic(this.platform.Characteristic.Name, device.device_name);

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this));                // SET - bind to the `setOn` method below

    // register handlers for the target temp Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .onSet(this.setTemperature.bind(this))
      .onGet(this.getTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .setProps({
        minStep: THERMOSTAT_STEP_VALUE,
      });
    const isFahrenheit = this.platform.getConfig().temperatureUnits === TemperatureUnits.F;
    let minValue = this.platform.getConfig().minimumTemperature;
    let maxValue = this.platform.getConfig().maximumTemperature;
    if (isFahrenheit) {
      minValue = fahrenheitToCelsius(minValue);
      maxValue = fahrenheitToCelsius(maxValue);
    }
    this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .setProps({
        minValue: minValue,
        maxValue: maxValue,
        minStep: THERMOSTAT_STEP_VALUE,
      });

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .setProps({
        validValues: [this.platform.Characteristic.TargetHeaterCoolerState.HEAT],
      });

    this.platform.log.debug(`Setting device on device: ${JSON.stringify(this.accessory.context, null, 2)}`);

    // push values to HomeKit
    const temperatureValue = isFahrenheit && device.info?.domestic_temperature ? fahrenheitToCelsius(device.info.domestic_temperature) :
      device.info.domestic_temperature;
    this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits,
      this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT);
    // this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
    //   .setProps({
    //     minValue: 120,
    //     maxValue: 140,
    //     validValues: [120, 125, 130, 135, 140],
    //   });
    //}
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, temperatureValue);
    this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, temperatureValue);

    this.service.updateCharacteristic(this.platform.Characteristic.On,
      device.info.domestic_combustion.toLowerCase() === API_VALUE_TRUE);
    this.service.updateCharacteristic(this.platform.Characteristic.Active,
      device.shadow.recirculation_enabled);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState,
      device.shadow.recirculation_enabled ?
        this.platform.Characteristic.CurrentHeaterCoolerState.HEATING :
        this.platform.Characteristic.CurrentHeaterCoolerState.IDLE);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setActive(value: CharacteristicValue) {
    this.platform.log.debug('Set Characteristic On ->', value);
    await this.platform.setState(this.accessory, API_KEY_SET_PRIORITY_STATUS, API_VALUE_TRUE);
    if (value as boolean) {
      await this.platform.setState(this.accessory, API_KEY_RECIRCULATION_DURATION, `${this.platform.getConfig().recirculationDuration}`);
      await this.platform.setState(this.accessory, API_KEY_SET_RECIRCULATION_ENABLED, API_VALUE_TRUE);
    } else {
      await this.platform.setState(this.accessory, API_KEY_RECIRCULATION_DURATION, '0');
      await this.platform.setState(this.accessory, API_KEY_SET_RECIRCULATION_ENABLED, API_VALUE_FALSE);
    }
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setTemperature(value: CharacteristicValue) {
    const convertedValue = Math.round(celsiusToFahrenheit(value as number));
    this.platform.log.debug('Set Characteristic Temperature -> ', value);

    await this.platform.setState(this.accessory, API_KEY_SET_PRIORITY_STATUS, API_VALUE_TRUE);
    await this.platform.setState(this.accessory, API_KEY_SET_TEMPERATURE, `${convertedValue}`);
    setTimeout(() => {
      this.platform.throttledPoll();
    }, SET_STATE_WAIT_TIME_MILLIS);
  }

  async getTemperature(): Promise<Nullable<CharacteristicValue>> {
    this.platform.throttledPoll();
    return null;
  }
}
