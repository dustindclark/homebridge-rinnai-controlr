import gql from 'graphql-tag';

export const USER_POOL_ID = 'us-east-1_OcwpRQbMM';
export const USER_POOL_WEB_CLIENT_ID = '5ghq3i6k4p9s7dfu34ckmec91';
export const REGION = 'us-east-1';

export const GRAPHQL_ENDPOINT = 'https://s34ox7kri5dsvdr43bfgp6qh6i.appsync-api.us-east-1.amazonaws.com/graphql';
export const SHADOW_ENDPOINT_PREFIX = 'https://698suy4zs3.execute-api.us-east-1.amazonaws.com/Prod/thing/';
export const SHADOW_ENDPOINT_SUFFIX = '/shadow';
export const API_KEY = 'da2-dm2g4rqvjbaoxcpo4eccs3k5he';
export const GET_DEVICES_QUERY = gql`
query GetUserByEmail(
  $email: String
  $sortDirection: ModelSortDirection
  $filter: ModelRinnaiUserFilterInput
  $limit: Int
  $nextToken: String
) {
  getUserByEmail(
    email: $email
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      devices {
        items {
          id
          thing_name
          device_name
          dealer_uuid
          city
          state
          street
          zip
          country
          firmware
          model
          dsn
          user_uuid
          connected_at
          key
          lat
          lng
          address
          vacation
          createdAt
          updatedAt
          activity {
            clientId
            serial_id
            timestamp
            eventType
          }
          shadow {
            heater_serial_number
            ayla_dsn
            rinnai_registered
            do_maintenance_retrieval
            model
            module_log_level
            set_priority_status
            set_recirculation_enable
            set_recirculation_enabled
            set_domestic_temperature
            set_operation_enabled
            schedule
            schedule_holiday
            schedule_enabled
            do_zigbee
            timezone
            timezone_encoded
            priority_status
            recirculation_enabled
            recirculation_duration
            lock_enabled
            operation_enabled
            module_firmware_version
            recirculation_not_configured
            maximum_domestic_temperature
            minimum_domestic_temperature
            createdAt
            updatedAt
          }
          monitoring {
            serial_id
            dealer_uuid
            user_uuid
            request_state
            createdAt
            updatedAt
            dealer {
              id
              name
              email
              admin
              approved
              confirmed
              aws_confirm
              imported
              country
              city
              state
              street
              zip
              company
              username
              firstname
              lastname
              st_accesstoken
              st_refreshtoken
              phone_country_code
              phone
              primary_contact
              terms_accepted
              terms_accepted_at
              terms_email_sent_at
              terms_token
              roles
              createdAt
              updatedAt
            }
          }
          schedule {
            items {
              id
              serial_id
              name
              schedule
              days
              times
              schedule_date
              active
              createdAt
              updatedAt
            }
            nextToken
          }
          info {
            serial_id
            ayla_dsn
            name
            domestic_combustion
            domestic_temperature
            wifi_ssid
            wifi_signal_strength
            wifi_channel_frequency
            local_ip
            public_ip
            ap_mac_addr
            recirculation_temperature
            recirculation_duration
            zigbee_inventory
            zigbee_status
            lime_scale_error
            mc__total_calories
            type
            unix_time
            m01_water_flow_rate_raw
            do_maintenance_retrieval
            aft_tml
            tot_cli
            unt_mmp
            aft_tmh
            bod_tmp
            m09_fan_current
            m02_outlet_temperature
            firmware_version
            bur_thm
            tot_clm
            exh_tmp
            m05_fan_frequency
            thermal_fuse_temperature
            m04_combustion_cycles
            hardware_version
            m11_heat_exchanger_outlet_temperature
            bur_tmp
            tot_wrl
            m12_bypass_servo_position
            m08_inlet_temperature
            m20_pump_cycles
            module_firmware_version
            error_code
            warning_code
            internal_temperature
            tot_wrm
            unknown_b
            rem_idn
            m07_water_flow_control_position
            operation_hours
            thermocouple
            tot_wrh
            recirculation_capable
            maintenance_list
            tot_clh
            temperature_table
            m19_pump_hours
            oem_host_version
            schedule_a_name
            zigbee_pairing_count
            schedule_c_name
            schedule_b_name
            model
            schedule_d_name
            total_bath_fill_volume
            dt
            createdAt
            updatedAt
          }
          errorLogs {
            items {
              id
              serial_id
              ayla_dsn
              name
              lime_scale_error
              m01_water_flow_rate_raw
              m02_outlet_temperature
              m04_combustion_cycles
              m08_inlet_temperature
              error_code
              warning_code
              operation_hours
              active
              createdAt
              updatedAt
            }
            nextToken
          }
          registration {
            items {
              serial
              dealer_id
              device_id
              user_uuid
              model
              gateway_dsn
              application_type
              recirculation_type
              install_datetime
              registration_type
              dealer_user_email
              active
              createdAt
              updatedAt
            }
            nextToken
          }
        }
        nextToken
      }
    }
  }
}
`;

export const API_KEY_SET_PRIORITY_STATUS = 'set_priority_status';
export const API_KEY_RECIRCULATION_DURATION = 'recirculation_duration';
export const API_KEY_SET_RECIRCULATION_ENABLED = 'set_recirculation_enabled';
export const API_KEY_SET_TEMPERATURE = 'set_domestic_temperature';
export const API_VALUE_TRUE = 'true';
export const API_VALUE_FALSE = 'false';

export const API_POLL_THROTTLE_MILLIS = 1000;
export const SET_STATE_WAIT_TIME_MILLIS = 5000;

export const MANUFACTURER = 'Rinnai';
export const UNKNOWN = 'Unknown';

export enum TemperatureUnits {
    C = 'C',
    F = 'F',
}

export const THERMOSTAT_STEP_VALUE = 0.5; // in C, as HomeKit uses this unit for accessories
export const WATER_HEATER_STEP_VALUE_IN_F = 2; // Controllers with the imperial unit, use 98/100/102/etc

// Increment only for breaking service changes to remove and re-add devices
export const PREVIOUS_UUID_SUFFICES = [''];
export const UUID_SUFFIX = '-1';