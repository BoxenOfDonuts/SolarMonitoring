# SolarMonitoring

This project was created because there is no monitoring or alerting when
inverters fail. I happened to be checking the sunpower app one day to show a
friend and noticed I had an alert. Turns out an inverter had be down for who
knows how long. As a bonus I can now track a bunch of metrics per inverter,
which is not possible using their app.

### Requirements

Create an .env file or add the following to your env

```
DATADOG_API_KEY=api_key
DATADOG_APP_KEY=app_key
WEATHER_API_KEY=weather_api_key
```

## Running with deno

To run the deno project

`$ deno task run`

To run the deno project with a watcher

`$ deno task dev`

If you dont want to use a task for some reason

`deno run  --allow-net=192.168.0.68,api.datadoghq.com --allow-read=. --allow-env --watch main.ts`

See the `deno.jsonc` doc for all the commands.

## Docker

### With Docker Run

`$ sudo docker run -e "DATADOG_API_KEY=api_key" -e "DATADOG_APP_KEY=app_key" -e "WEATHER_API_KEY=weather_api_key" -d -e TZ=America/Chicago --name solar-monitor boxenofdonuts/solar-monitor:latest`

### As a Dockerfile

```
version: "3.4"
services:
  solar-monitor:
    image: boxenofdonuts/solar-monitor:latest
    container_name: solar-monitor
    environment:
      - PUID=1028 # optional
      - PGID=65536 # optional
      - TZ=America/Chicago # optional
      - DATADOG_API_KEY=api_key
      - DATADOG_APP_KEY=app_key
      - WEATHER_API_KEY=weather_api_key
    restart: unless-stopped
```

## Notes

Most of the original python was written because of the
[notes]([https://github.com/ginoledesma/sunpower-pvs-exporter/blob/master/sunpower_pvs_notes.md)
here.

### With Docker Hub

The project automatically builds and pushes to docker hub, however it only uses
the 'latest' tag. To tag run the following:

```
sudo docker build -t boxenofdonuts/solar-monitoring:1.0.3 .
// This will tag it as version 1.0.3
```
