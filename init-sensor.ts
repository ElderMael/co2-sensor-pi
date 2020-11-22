import {
    APP_START_REGISTER,
    HARDWARE_ID_REGISTER,
    MEASUREMENT_MODE_REGISTER,
    MeasureMode,
    RESET_REGISTER,
    SENSOR_ADDRESS,
    SENSOR_HARDWARE_ID_MAGIC_NUMBER,
    STATUS_REGISTER
} from "./sensor-constants";
import bitwise from "bitwise";


function initSensor(i2c: any) {
    console.log("Starting I2C Sensor Reading");
    // Soft Reset
    console.log("Soft Reset Register To Boot Mode");
    i2c.writeSync(SENSOR_ADDRESS, RESET_REGISTER, Buffer.from([0x11, 0xe5, 0x72, 0x8a]));

    setTimeout(() => {
        // Read Hardware ID
        console.log("Reading hardware ID.")
        const hardwareIdBuffer = i2c.readSync(SENSOR_ADDRESS, HARDWARE_ID_REGISTER, 1);
        const hardwareId = hardwareIdBuffer[0];

        if (hardwareId !== SENSOR_HARDWARE_ID_MAGIC_NUMBER) {
            console.log("Hardware ID did not match: ", hardwareId);
            process.exit(1);
        }

        // Read status
        console.log("Reading status from  sensor.")
        const statusBuffer = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);
        const statusApplicationBit = bitwise.integer.getBit(statusBuffer[0], 4);
        console.log("Status byte on binary: ", bitwise.byte.read(statusBuffer[0]));

        if (statusApplicationBit !== 1) {
            console.log("Application mode bit error. Stopping.", statusApplicationBit);
            process.exit(1);
        }

        console.log("Write to App Start register");
        i2c.writeSync(SENSOR_ADDRESS, APP_START_REGISTER, Buffer.from([]));

        console.log("Reading status from  sensor.")
        const appStatusBuffer = i2c.readSync(SENSOR_ADDRESS, STATUS_REGISTER, 1);
        let appStatusByte = appStatusBuffer[0];
        const firmwareModeBit = bitwise.integer.getBit(appStatusByte, 7);
        console.log("Status from buffer:", bitwise.byte.read(appStatusByte));

        if (firmwareModeBit !== 1) {
            console.log("Firmware mode bit is not 1", firmwareModeBit);
        }

        console.log("Write drive mode");
        i2c.writeSync(SENSOR_ADDRESS, MEASUREMENT_MODE_REGISTER, Buffer.from([MeasureMode.EverySixtySeconds]));

    }, 500);
}

export default initSensor;