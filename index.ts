import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
import {I2C} from 'raspi-i2c';

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
        const buffer = i2c.readSync(0x5a, 0x02, 8);
        console.log("Buffer: ", buffer.toJSON())
        let lectureBe = (buffer.readUInt16LE(0) << 8) | buffer.readUInt16LE(1);
        console.log(`Buffer read: ${lectureBe} ppm`);
        i2c.writeSync(0x5a, 0x11, Buffer.from([ 0x847B >> 8 , 0x847B ]));
        simpleCounter.set(lectureBe);
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
    i2c.writeSync(0x5a, 0xFF, Buffer.from([0x11, 0xe5, 0x72, 0x8a]));

    setTimeout(() => {

        console.log("Check if ready");
        const readyBuff = i2c.readSync(0x5a, 0x20, 1);

        console.log("Ready buffer:", readyBuff);
        // bootloader
        i2c.writeSync(0x5a, 0xF4, Buffer.from([0x00]));
        // Measurement mode
        i2c.writeSync(0x5a, 0x01, Buffer.from([0x01]));
        // Temp Hum
        i2c.writeSync(0x5a, 0x05, Buffer.from([0x01, 0x00, 0x01, 0x00]));
    }, 100);

    console.log(`server started at http://localhost:${port}`);
});