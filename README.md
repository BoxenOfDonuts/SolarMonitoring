# SolarMonitoring
This project was created because there is no monitoring or alerting when inverters fail. I happened to be checking the sunpower app one day to show a friend and noticed I had an alert. Turns out an inverter had be down for who knows how long. As a bonus I can now track a bunch of metrics per inverter, which is not possible using their app.

## Running
When developing run `deno run  --allow-net=192.168.0.68,api.datadoghq.com --allow-read=. --allow-env --watch main.ts`

See the `deno.jsonc` doc for all the commands.

## Notes
Most of the original python was writin because of the [notes]([https://github.com/ginoledesma/sunpower-pvs-exporter/blob/master/sunpower_pvs_notes.md) here.
