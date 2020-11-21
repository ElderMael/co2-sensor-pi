export const SENSOR_ADDRESS = 0x5a;
export const RESET_REGISTER = 0xFF;
export const APP_START_REGISTER = 0xF4;
export const MEASUREMENT_MODE_REGISTER = 0x01;
const ENVIRONMENT_DATA_REGISTER = 0x05;
export const ERROR_REGISTER = 0xE0;
export const STATUS_REGISTER = 0x00;
export const RESULT_DATA_REGISTER = 0x02;
export const HARDWARE_ID_REGISTER = 0x20;

export enum MeasureMode {
    Idle = 0b0_000_0_000,      //Idle (Measurements are disabled in this mode)
    EverySecond = 0b0_001_0_000,    //Constant power mode, IAQ measurement every second
    EveryTenSeconds = 0b0_010_0_000,   //Pulse heating mode IAQ measurement every 10 seconds
    EverySixtySeconds = 0b0_011_0_000,   //Low power pulse heating mode IAQ measurement every 60 seconds
    ConstantPower = 0b0_100_0_000 // Measures Every 250 ms
}

export const MAX_CO2_SENSOR_VALUE = 8192;
export const MIN_CO2_SENSOR_VALUE = 400;
export const MAX_TVOC_SENSOR_VALUE = 8192;
export const MIN_TVOC_SENSOR_VALUE = 400;