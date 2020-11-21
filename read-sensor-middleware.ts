import {
    ERROR_REGISTER,
    MAX_CO2_SENSOR_VALUE,
    MAX_TVOC_SENSOR_VALUE,
    MIN_CO2_SENSOR_VALUE,
    MIN_TVOC_SENSOR_VALUE,
    RESULT_DATA_REGISTER,
    SENSOR_ADDRESS,
    STATUS_REGISTER
} from "./sensor-constants";
import bitwise from "bitwise";
import {RequestHandler} from "express";
import {co2Gauge, errorCountersByBitPosition, tvocGauge} from "./co2-gauge";

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

function isNotCo2ReadingWithinRange(co2Reading: number) {
    return co2Reading > MAX_CO2_SENSOR_VALUE || co2Reading < MIN_CO2_SENSOR_VALUE;
}

function isNotTvocReadingWithinRange(tvocReading: number) {
    return tvocReading > MAX_TVOC_SENSOR_VALUE || tvocReading < MIN_TVOC_SENSOR_VALUE;
}

export default function readSensorMiddleware(i2c: any): RequestHandler {
    let lastCo2Reading: number | undefined;
    let lastTvocReading: number | undefined;
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

            const co2Reading = buffer.readUInt16BE();
            const tvocReading = buffer.readUInt16BE(2);

            if (isNotCo2ReadingWithinRange(co2Reading) || isNotTvocReadingWithinRange(tvocReading)) {
                console.log(`Readings not within thresholds:
                 CO2: ${co2Reading} ppm
                 TVOC: ${tvocReading} ppb 
                 checking error register.`
                );

                co2Gauge.set(lastCo2Reading ? lastCo2Reading : MIN_CO2_SENSOR_VALUE);
                tvocGauge.set(lastTvocReading ? lastTvocReading : MIN_TVOC_SENSOR_VALUE);

                checkErrorRegister(i2c);

                return;
            }

            lastCo2Reading = co2Reading;
            lastTvocReading = tvocReading;

            co2Gauge.set(co2Reading);
            tvocGauge.set(tvocReading);

        } catch (e) {
            console.log("Error reading buffer.", e);
        } finally {
            next();
        }
    };
}