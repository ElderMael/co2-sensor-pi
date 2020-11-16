import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
import {I2C} from 'raspi-i2c';

const SENSOR_ADDRESS = 0x5a;
const RESET_REGISTER = 0xFF;
const APP_START_REGISTER = 0xF4;
const MEASUREMENT_MODE_REGISTER = 0x01;
const ENVIRONMENT_DATA_REGISTER = 0x05;
const STATUS_REGISTER = 0x00;
const RESULT_DATA_REGISTER = 0x02;


let i2c: any;

const app = express();
const port = 8080;

const promExporter = PromExporter({
    appName: 'co2-sensor-pi'
});

const Prometheus = promExporter.client;

const simpleCounter = new Prometheus.Gauge({
    name: 'co2_lecture',
    help: 'One route increases another one decreases'
});

app.use(promExporter.middleware);

app.use((req, res, next) => {
    console.log("Reading from sensor to collect metrics");
    try {

        const dataReady = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);
        console.log("Data ready?", dataReady.toJSON())

        if ((dataReady[0] >> 3) & 0x01) {
            console.log("Data not ready");
            return;
        }

        console.log("Data is ready, reading buffer");
        const buffer = i2c.readSync(SENSOR_ADDRESS, RESULT_DATA_REGISTER, 8);

        console.log("Buffer: ", buffer.toJSON())
        let lecture = (buffer[0] << 8) | buffer[1];

        console.log(`Buffer read: ${lecture} ppm`);

        simpleCounter.set(lecture);

        // Write Baseline
        i2c.writeSync(SENSOR_ADDRESS, 0x11, Buffer.from([0x847B >> 8, 0x847B]));

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
    console.log("Soft Reset Register");
    i2c.writeSync(SENSOR_ADDRESS, RESET_REGISTER, Buffer.from([0x11, 0xe5, 0x72, 0x8a]));

    setTimeout(() => {

        console.log("Check if ready");
        const readyBuff = i2c.readSync(SENSOR_ADDRESS, 0x20, 1);

        console.log("Ready buffer:", readyBuff);
        // bootloader
        i2c.writeSync(SENSOR_ADDRESS, APP_START_REGISTER, Buffer.from([0x00]));
        // Measurement mode
        i2c.writeSync(SENSOR_ADDRESS, MEASUREMENT_MODE_REGISTER, Buffer.from([0x01]));
        // Temp Hum
        i2c.writeSync(SENSOR_ADDRESS, ENVIRONMENT_DATA_REGISTER, Buffer.from([0x01, 0x00, 0x01, 0x00]));
    }, 100);

    console.log(`server started at http://localhost:${port}`);
});