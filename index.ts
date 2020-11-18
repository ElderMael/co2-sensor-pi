import express from "express";
import {I2C} from 'raspi-i2c';
import initSensor from "./init-sensor";
import {readSensorMiddleware} from "./read-sensor-middleware";
import {co2Gauge, promExporter} from "./co2-gauge";

let i2c = new I2C();

const app = express();

app.use(promExporter.middleware);
app.use(readSensorMiddleware(i2c, co2Gauge));
app.get('/metrics', promExporter.metrics);

const {SERVER_PORT} = process.env;
const serverPort = SERVER_PORT || 8080;

app.listen(serverPort, () => {
    initSensor(i2c);
    console.log(`server started at http://localhost:${serverPort}`);
});