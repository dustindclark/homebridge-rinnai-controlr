# Homebridge Rinnai Control-R Plugin
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![NPM Version](https://img.shields.io/npm/v/homebridge-rinnai-controlr.svg)](https://www.npmjs.com/package/homebridge-rinnai-controlr)

This plugin integrates with Rinnai Control-R to provide HomeKit-based control of your Rinnai hot water heaters.

> :warning: I have only tested with my Rinnai RUR160iN. **Use at your own risk!**
> 

This plugin requires the latest Control-R firmware and credentials from the Rinnai 2.0 app.

##Installation
Example configuration is below.  See [config.schema.json](./blob/master/config.schema.json) for more info, including valid values.

```javascript
"platforms": [
    ...
    {
        "name": "RinnaiControlR",
        "platform": "RinnaiControlR",
        "username": "youremail@domain.com",
        "password": "your-password-in-rinnai-ap",
        "recirculationDuration": 15,
        "temperatureUnits": "F",
        "minimumTemperature": 120,
        "maximumTemperature": 140
    }
]
```

