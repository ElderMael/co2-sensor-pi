import PromExporter from "@tailorbrands/node-exporter-prometheus";

export const promExporter = PromExporter({
    appName: 'co2-sensor-pi'
});

export const co2Gauge = new promExporter.client.Gauge({
    name: 'co2_ppm',
    help: 'Carbon Dioxide PPM'
});

export const messageInvalidErrorCounter = new promExporter.clientCounter({
   name: 'message_invalid_errors',
});

export const readRegisterInvalidErrorCounter = new promExporter.clientCounter({
    name: 'read_reg_invalid_errors',
});

export const measurementModeInvalidErrorCounter = new promExporter.clientCounter({
    name: 'meas_mode_invalid_errors',
});

export const maxResistanceErrorCounter = new promExporter.clientCounter({
    name: 'max_resistance_errors',
});

export const heaterFaultErrorCounter = new promExporter.clientCounter({
    name: 'heater_fault_errors',
});

export const heaterSupplyErrorCounter = new promExporter.clientCounter({
    name: 'heater_supply_errors',
});

export const unknownErrorCounter = new promExporter.clientCounter({
    name: 'unknown_errors',
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