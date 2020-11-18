import {ERROR_REGISTER, RESULT_DATA_REGISTER, SENSOR_ADDRESS, STATUS_REGISTER} from "./sensor-constants";
import bitwise from "bitwise";
import {RequestHandler} from "express";

export default function readSensorMiddleware(i2c: any, co2Gauge: any): RequestHandler {

    return (req, res, next) => {
        console.log("Reading from sensor to collect metrics");

        try {

            const statusRegisterReading = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);

            const isDataReady = bitwise.integer.getBit(statusRegisterReading[0], 4);

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

            co2Gauge.set(reading);

        } catch (e) {
            console.log("Error reading buffer.", e);
        } finally {
            next();
        }
    };
}