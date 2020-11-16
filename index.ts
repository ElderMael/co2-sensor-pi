import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
import { I2C } from 'raspi-i2c';

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
        console.log("Buffer read:", buffer)
    } catch (e) {
        console.log("Error reading buffer.", e);
    } finally {
        simpleCounter.set(10);
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

    i2c.writeSync( 0x5a ,0xFF, [0x11, 0xe5, 0x72, 0x8a]);

    setTimeout(function() {
        i2c.writeSync( 0x5a ,0xF4, [ 0xF4, 0]);
    }, 100);

    console.log(`server started at http://localhost:${port}`);
});