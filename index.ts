import express from "express";
import PromExporter from "@tailorbrands/node-exporter-prometheus"
// `appName` is the name of your service/application

const app = express();
const port = 8080;

const options = {
    appName: 'co2-sensor-pi'
};

console.log(PromExporter);

const promExporter = PromExporter(options);

app.use(promExporter.middleware);
app.get('/metrics', promExporter.metrics);


app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});