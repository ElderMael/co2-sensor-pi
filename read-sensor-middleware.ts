import {ERROR_REGISTER, RESULT_DATA_REGISTER, SENSOR_ADDRESS, STATUS_REGISTER} from "./sensor-constants";
import bitwise from "bitwise";
import {RequestHandler} from "express";
import {co2Gauge, errorCountersByBitPosition} from "./co2-gauge";

const MAX_CO2_SENSOR_VALUE = 8192;
const MIN_CO2_SENSOR_VALUE = 400;

function checkErrorRegister(i2c: any) {
    let errorRegisterBytes = i2c.readSync(SENSOR_ADDRESS, ERROR_REGISTER, 1);
    let errorBits = bitwise.byte.read(errorRegisterBytes[0]);
    console.log("Error byte: ",
        errorBits
    );

    errorBits.forEach((bit, index) => {
        if (bit) {
            errorCountersByBitPosition[index].inc();
        }
    });

}

export default function readSensorMiddleware(i2c: any): RequestHandler {
    let lastReading: number | undefined;
    return (req, res, next) => {
        console.log("Reading from sensor to collect metrics");

        try {

            const statusRegisterReading = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);

            const isDataReady = bitwise.integer.getBit(statusRegisterReading[0], 4);

            if (isDataReady === 0) {
                console.log("Data not ready. Skipping.");
                console.log("Status Register Data:", bitwise.byte.read(statusRegisterReading[0]));

                checkErrorRegister(i2c);
                return;
            }

            console.log("Data is ready, reading buffer");
            const buffer = i2c.readSync(SENSOR_ADDRESS, RESULT_DATA_REGISTER, 8);

            console.log("Buffer: ", buffer.toJSON())

            let reading = buffer.readUInt16BE();

            if (reading > MAX_CO2_SENSOR_VALUE || reading < MIN_CO2_SENSOR_VALUE) {
                console.log("Reading is not within sensor threshold, checking error register");
                co2Gauge.set(lastReading ? lastReading : MIN_CO2_SENSOR_VALUE);

                checkErrorRegister(i2c);

                return;
            }

            lastReading = reading;
            co2Gauge.set(reading);

        } catch (e) {
            console.log("Error reading buffer.", e);
        } finally {
            next();
        }
    };
}