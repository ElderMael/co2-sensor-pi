import PromExporter from "@tailorbrands/node-exporter-prometheus";

export const promExporter = PromExporter({
    appName: 'co2-sensor-pi'
});

export const co2Gauge = new promExporter.client.Gauge({
    name: 'co2_ppm',
    help: 'Carbon Dioxide Measure In  Parts Per Million'
});

export const tvocGauge = new promExporter.client.Gauge({
    name: 'tvoc_ppb',
    help: 'Total Volatile Organic Compounds In Parts Per Billion'
});

export const messageInvalidErrorCounter = new promExporter.client.Counter({
    name: 'message_invalid_errors',
    help: 'Message Invalid Sensor Error Count'
});

export const readRegisterInvalidErrorCounter = new promExporter.client.Counter({
    name: 'read_reg_invalid_errors',
    help: 'Register Read Invalid Sensor Error Count'
});

export const measurementModeInvalidErrorCounter = new promExporter.client.Counter({
    name: 'meas_mode_invalid_errors',
    help: 'Measurement Mode Invalid Error Count'
});

export const maxResistanceErrorCounter = new promExporter.client.Counter({
    name: 'max_resistance_errors',
    help: 'Maximum Resistance Reached Error Count'
});

export const heaterFaultErrorCounter = new promExporter.client.Counter({
    name: 'heater_fault_errors',
    help: 'Heater Fault Error Count'
});

export const heaterSupplyErrorCounter = new promExporter.client.Counter({
    name: 'heater_supply_errors',
    help: 'Heater Supply Error Count'
});

export const unknownErrorCounter = new promExporter.client.Counter({
    name: 'unknown_errors',
    help: 'Unknown Sensor Error Count'
});


export const errorCountersByBitPosition = [
    messageInvalidErrorCounter,
    readRegisterInvalidErrorCounter,
    measurementModeInvalidErrorCounter,
    maxResistanceErrorCounter,
    heaterFaultErrorCounter,
    heaterSupplyErrorCounter,
    unknownErrorCounter,
    unknownErrorCounter
];