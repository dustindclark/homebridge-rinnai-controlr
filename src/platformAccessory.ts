import {CharacteristicValue, Nullable, PlatformAccessory, Service} from 'homebridge';

import {RinnaiControlrHomebridgePlatform} from './platform';
import {
    API_KEY_RECIRCULATION_DURATION,
    API_KEY_SET_PRIORITY_STATUS, API_KEY_SET_RECIRCULATION_ENABLED,
    API_KEY_SET_TEMPERATURE,
    API_VALUE_TRUE,
    MANUFACTURER,
    SET_STATE_WAIT_TIME_MILLIS,
    TemperatureUnits, THERMOSTAT_STEP_VALUE,
    WATER_HEATER_STEP_VALUE_IN_F,
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
    private readonly minValue: number; // in C
    private readonly maxValue: number; // in C
    private targetTemperature: number; // in C

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

        this.minValue = Math.floor(this.minValue / THERMOSTAT_STEP_VALUE) * THERMOSTAT_STEP_VALUE;
        this.maxValue = Math.ceil(this.maxValue / THERMOSTAT_STEP_VALUE) * THERMOSTAT_STEP_VALUE;

        this.targetTemperature = this.isFahrenheit && this.device.info?.domestic_temperature
            ? fahrenheitToCelsius(this.device.info.domestic_temperature)
            : this.device.info.domestic_temperature;

        this.platform.log.info(`Temperature Slider Min: ${this.minValue}, Max: ${this.maxValue}, ` +
            `target temperature: ${this.targetTemperature}`);

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
            .onSet(this.setTargetTemperature.bind(this))
            .onGet(this.getTargetTemperature.bind(this))
            .setProps({
                minValue: this.minValue,
                maxValue: this.maxValue,
                minStep: THERMOSTAT_STEP_VALUE,
            })
            .updateValue(this.targetTemperature);

        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getTargetTemperature.bind(this))
            .updateValue(this.targetTemperature)
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
        const duration = (value as boolean) ? `${this.platform.getConfig().recirculationDuration}`
            : '0';
        this.platform.log.info(`setRecirculateActive to ${value} for device ${this.device.dsn}`);

        const state: Record<string, string | boolean> = {
            [API_KEY_SET_PRIORITY_STATUS]: true,
            [API_KEY_RECIRCULATION_DURATION]: duration,
            [API_KEY_SET_RECIRCULATION_ENABLED]: (value as boolean),
        };
        await this.platform.setState(this.accessory, state);
    }

    async setTargetTemperature(value: CharacteristicValue) {
        this.platform.log.info(`setTemperature to ${value} for device ${this.device.dsn}`);

        const convertedValue: number = this.isFahrenheit
            ? Math.round(celsiusToFahrenheit(value as number) / WATER_HEATER_STEP_VALUE_IN_F) * WATER_HEATER_STEP_VALUE_IN_F
            : value as number;

        this.platform.log.info(`Sending converted/rounded temperature: ${convertedValue}`);

        const state: Record<string, string | number | boolean> = {
            [API_KEY_SET_PRIORITY_STATUS]: true,
            [API_KEY_SET_TEMPERATURE]: convertedValue,
        };

        await this.platform.setState(this.accessory, state);
        setTimeout(() => {
            this.platform.throttledPoll();
        }, SET_STATE_WAIT_TIME_MILLIS);
        this.targetTemperature = this.isFahrenheit ? fahrenheitToCelsius(convertedValue) : convertedValue;
    }

    async getTargetTemperature(): Promise<Nullable<CharacteristicValue>> {
        this.platform.throttledPoll();
        return this.targetTemperature;
    }
}
