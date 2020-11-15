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
    name: 'simple_counter',
    help: 'One route increases another one decreases'
});

app.use((req, res, next) => {
    try {
        const rxbuf = new Buffer(32);
        const bytes = rpio.i2cRead(rxbuf, 16).toString();
        console.log('Bytes read from gpio sensor:', bytes);
    } finally {
        simpleCounter.set();
        next();
    }
});
app.use(promExporter.middleware);

app.get('/metrics', promExporter.metrics);

app.on('listening', () => {
    rpio.i2cBegin();

    rpio.i2cSetSlaveAddress(0x20);

    rpio.i2cSetBaudRate(50000);
});

app.on('close', () => {
    rpio.i2cEnd();
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});