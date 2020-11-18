import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
import {I2C} from 'raspi-i2c';
import bitwise from "bitwise";

const SENSOR_ADDRESS = 0x5a;
const RESET_REGISTER = 0xFF;
const APP_START_REGISTER = 0xF4;
const MEASUREMENT_MODE_REGISTER = 0x01;
const ENVIRONMENT_DATA_REGISTER = 0x05;
const ERROR_REGISTER = 0xE0;
const STATUS_REGISTER = 0x00;
const RESULT_DATA_REGISTER = 0x02;
const HARDWARE_ID_REGISTER = 0x20;

enum MeasureMode {
    Idle = 0b0_000_0_000,      //Idle (Measurements are disabled in this mode)
    EverySecond = 0b0_001_0_000,    //Constant power mode, IAQ measurement every second
    EveryTenSeconds = 0b0_010_0_000,   //Pulse heating mode IAQ measurement every 10 seconds
    EverySixtySeconds = 0b0_011_0_000,   //Low power pulse heating mode IAQ measurement every 60 seconds
    ConstantPower = 0b0_100_0_000 // Measures Every 250 ms
}

const MEASURE_250_MS = 0x04;


let i2c: any;

const app = express();
const port = 8080;

const promExporter = PromExporter({
    appName: 'co2-sensor-pi'
});

const Prometheus = promExporter.client;

const simpleCounter = new Prometheus.Gauge({
    name: 'co2_ppm',
    help: 'Carbon Dioxide PPM'
});

app.use(promExporter.middleware);

app.use((req, res, next) => {
    console.log("Reading from sensor to collect metrics");
    try {

        const statusRegisterReading = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);

        const isDataReady = bitwise.integer.getBit(statusRegisterReading[0], 3);

        if (isDataReady === 0) {
            console.log("Data not ready. Skipping.");
            console.log("Status Register Data:", bitwise.byte.read(statusRegisterReading[0]));

            let errorRegisterBytes = i2c.readSync(SENSOR_ADDRESS, ERROR_REGISTER, 2);
            console.log("Error bytes: ",
                bitwise.byte.read(errorRegisterBytes[0]),
                bitwise.byte.read(errorRegisterBytes[1])
            );
            return;
        }

        console.log("Data is ready, reading buffer");
        const buffer = i2c.readSync(SENSOR_ADDRESS, RESULT_DATA_REGISTER, 8);

        console.log("Buffer: ", buffer.toJSON())
        let reading = buffer.readUInt16BE();

        console.log(`Buffer read: ${reading} ppm`);

        simpleCounter.set(reading);

    } catch (e) {
        console.log("Error reading buffer.", e);
    } finally {
        next();
    }
});

app.on('close', () => {
    console.log("Stopping RPIO");
});

app.get('/metrics', promExporter.metrics);


app.listen(port, () => {
    console.log("Starting I2C Sensor Reading");

    i2c = new I2C();

    // Soft Reset
    console.log("Soft Reset Register To Boot Mode");
    i2c.writeSync(SENSOR_ADDRESS, RESET_REGISTER, Buffer.from([0x11, 0xe5, 0x72, 0x8a]));

    setTimeout(() => {
        // Read Hardware ID
        console.log("Reading hardware ID.")
        const hardwareIdBuffer = i2c.readSync(SENSOR_ADDRESS, HARDWARE_ID_REGISTER, 1);
        const hardwareId = hardwareIdBuffer[0];
        console.log("Hardware ID from sensor:", bitwise.byte.read(hardwareId));

        if (hardwareId !== 0x81) {
            console.log("Hardware ID did not match: ", hardwareId);
            process.exit(1);
        }

        // Read status
        console.log("Reading status from  sensor.")
        const statusBuffer = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);
        const statusApplicationBit = bitwise.integer.getBit(statusBuffer[0], 4);
        console.log("Status byte on binary: ", bitwise.byte.read(statusBuffer[0]));

        if (statusApplicationBit !== 1) {
            console.log("Application mode bit error. Stopping.", statusApplicationBit);
            process.exit(1);
        }

        console.log("Write to App Start register");
        i2c.writeSync(SENSOR_ADDRESS, APP_START_REGISTER, Buffer.from([]));

        console.log("Reading status from  sensor.")
        const appStatusBuffer = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);
        let appStatusByte = appStatusBuffer[0];
        const firmwareModeBit = bitwise.integer.getBit(appStatusByte, 7);
        console.log("Status from buffer:", bitwise.byte.read(appStatusByte));

        if (firmwareModeBit !== 1) {
            console.log("Firmware mode bit is not 1", firmwareModeBit);
        }

        console.log("Write drive mode");
        i2c.writeSync(SENSOR_ADDRESS, MEASUREMENT_MODE_REGISTER, Buffer.from([MeasureMode.EverySixtySeconds]));

    }, 500);

    console.log(`server started at http://localhost:${port}`);
});