import PromExporter from "*";

export const promExporter = PromExporter({
    appName: 'co2-sensor-pi'
});

export const co2Gauge = new promExporter.client.Gauge({
    name: 'co2_ppm',
    help: 'Carbon Dioxide PPM'
});