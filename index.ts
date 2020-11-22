import express from "express";
import {I2C} from 'raspi-i2c';

import initSensor from "./init-sensor";
import readSensorMiddleware from './read-sensor-middleware';
import {promExporter} from './co2-gauge';

const {SERVER_PORT} = process.env;
const serverPort = SERVER_PORT || 8080;

const i2c = new I2C();

const app = express();

app.use(promExporter.middleware);
app.use(readSensorMiddleware(i2c));
app.get('/metrics', promExporter.metrics);

app.listen(serverPort, () => {
    initSensor(i2c);
    console.log(`server started at http://localhost:${serverPort}`);
});