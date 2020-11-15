import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
import rpio from "rpio";

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
        const rxbuf = Buffer.alloc(32);
        const bytes = rpio.i2cRead(rxbuf, 16);
        console.log('Bytes read from gpio sensor:', bytes, rxbuf.toJSON());
    } catch (e) {
        console.log("Error reading buffer.", e);
    } finally {
        simpleCounter.set(10);
        next();
    }
});

app.on('close', () => {
    console.log("Stopping RPIO");
    rpio.i2cEnd();
});

app.get('/metrics', promExporter.metrics);

app.listen(port, () => {
    console.log("Starting I2C Sensor Reading");
    rpio.i2cBegin();

    rpio.i2cSetSlaveAddress(0x5a);

    rpio.i2cSetBaudRate(115200);

    rpio.i2cWrite(Buffer.from([0x11, 0xE5, 0x72, 0x8A]));

    setTimeout(function() {
        rpio.i2cWrite(Buffer.from([ 0xF4, 0 ]));
    }, 100);

    console.log(`server started at http://localhost:${port}`);
});