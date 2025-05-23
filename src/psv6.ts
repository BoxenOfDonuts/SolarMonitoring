import { parse } from "@std/datetime";
import { post } from "./conf/fetch.ts";
import { apiKey, defaultSleep, oneHour, twoMinutes } from "#constants";
import { log } from "#log";

import type {
  APIResponse,
  PSVDevices,
  PSVInverter,
  PSVPowerMeter,
} from "./models/psv-types.d.ts";

import Sun from "./models/sun.ts";

class BaseDatadog {
  type: string;
  id: string;
  status: number;
  tags: string[];
  time: number;

  constructor(device: PSVDevices) {
    this.type = device.DEVICE_TYPE;
    this.id = device.SERIAL;
    // # For DataDog
    // # 0 - Ok, 1 - Warning, 2 - Critical, 3 - Unkown
    this.status = device.STATE === "working" ? 0 : 2;
    this.tags = [`${device.DEVICE_TYPE}:${device.SERIAL}`];
    this.time = this.formatDate(device.DATATIME);
  }

  private formatDate(time: string) {
    const format = "yyyy,MM,dd,HH,mm,ss";
    const TIME_IN_MILISECOND = 60000;
    const date = parse(time, format);
    const offSet = new Date().getTimezoneOffset() * TIME_IN_MILISECOND;
    const diff = (date.getTime() - offSet) / 1000;
    return diff;
  }

  async sendCheck() {
    const headers = new Headers({
      "DD-API-KEY": apiKey,
      "Content-Type": "application/json",
    });

    const body = {
      check: "solar.status",
      status: this.status,
      tags: this.tags,
    };

    const url = "https://api.datadoghq.com/api/v1/check_run";

    try {
      const response = await post(url, body, headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending check to datadog", error);
    }
  }
}

class Inverter extends BaseDatadog {
  lifetimePower: number;
  currentGeneration: number;

  constructor(device: PSVInverter) {
    super(device);
    this.lifetimePower = parseFloat(device.ltea_3phsum_kwh);
    this.currentGeneration = parseFloat(device.p_3phsum_kw);
  }

  async sendMetrics() {
    const url = "https://api.datadoghq.com/api/v2/series/";
    const headers = new Headers({
      "DD-API-KEY": apiKey,
      "Content-Type": "application/json",
    });

    const body = {
      series: [
        {
          metric: "solar.current.generation",
          type: 0,
          points: [{ value: this.currentGeneration, timestamp: this.time }],
          tags: this.tags,
        },
        {
          metric: "solar.lifetime.power",
          type: 0,
          points: [{ value: this.lifetimePower, timestamp: this.time }],
          tags: this.tags,
        },
      ],
    };

    try {
      const response = await post(url, body, headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending metric to datadog", error);
    }
  }
}

class Meter extends BaseDatadog {
  totalNetEnergy: number | undefined;

  constructor(device: PSVPowerMeter) {
    super(device);
    this.totalNetEnergy = parseInt(device.net_ltea_3phsum_kwh);
  }

  async sendMetrics() {
    const url = "https://api.datadoghq.com/api/v2/series/";
    const headers = new Headers({
      "DD-API-KEY": apiKey,
      "Content-Type": "application/json",
    });

    const body = {
      series: [
        {
          metric: "solar.net.energy",
          type: 0,
          points: [{ value: this.totalNetEnergy, timestamp: this.time }],
          tags: this.tags,
        },
      ],
    };

    try {
      const response = await post(url, body, headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending metric to datadog", error);
    }
  }
}

async function getDeviceList(): Promise<APIResponse> {
  const response = await fetch(
    "http://192.168.0.68/cgi-bin/dl_cgi?Command=DeviceList",
  );
  const data = await response.json().catch(async (error) => {
    log.error("Error parsing response", error);
    await sleep(twoMinutes);
    return getDeviceList();
  });
  return data;
}

type Devices = Inverter | Meter;
function formatDevices(devices: PSVDevices[]) {
  const formatted = devices.reduce(
    (accum: Record<PSVDevices["SERIAL"], Devices>, device: PSVDevices) => {
      switch (device.DEVICE_TYPE) {
        case "Inverter":
          accum[device.SERIAL] = new Inverter(device as PSVInverter);
          // letting datadog do sum(currentGeneration)
          break;
        case "Power Meter":
          accum[device.SERIAL] = new Meter(device as PSVPowerMeter);
          break;
        default:
          break;
      }
      return accum;
    },
    {},
  );
  return formatted;
}

function isInverter(device: Devices): device is Inverter {
  return device.type === "Inverter";
}

function timeLeftInDay() {
  const now = Date.now();
  const midnight = new Date().setHours(24, 0, 0, 0);
  return midnight - now;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const deviceList = await getDeviceList();
  const formatted = formatDevices(deviceList.devices);

  Object.values(formatted).forEach((device: Devices) => {
    device.sendMetrics();
    device.sendCheck();
  });
}

if (import.meta.main) {
  log.info("Starting script");
  const sun = new Sun();
  log.info("Getting sunrise and sunset ");
  await sun.initialize();
  log.info("Staring main loop");
  while (true) {
    const now = Date.now();
    if (now > sun.sunrise && now < sun.sunset) {
      main();
      log.debug(
        `sent metrics, sleeping for ${defaultSleep / 1000 / 60} minutes`,
      );
      await sleep(defaultSleep);
    } else if (now > sun.sunset) {
      log.debug(
        `not sending metrics, it's dark. Sleeping till tomorrow at 1 am`,
      );
      const sleepTime = timeLeftInDay() + oneHour;
      await sleep(sleepTime);
      await sun.update();
    } else if (now < sun.sunrise) {
      const sleepTime = sun.sunrise - Date.now();
      log.debug(`not sending metrics, it's dark. Sleeping until sunrise`);
      await sleep(sleepTime);
    }
  }
}
