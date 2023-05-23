import { load } from "https://deno.land/std@0.188.0/dotenv/mod.ts";
import { parse } from "https://deno.land/std@0.188.0/datetime/mod.ts";
// tomorrow - look at deno tasks to pass in the .env file
// maybe spit some of this into other files
// need to do the checks

import type {
  APIResponse,
  PSVDevices,
  PSVInverter,
  PSVPowerMeter,
} from "./psv-types.d.ts";
const env = await load();

const apiKey = env["DATADOG_API_KEY"];
const appKey = env["DATADOG_APP_KEY"];
const weatherApiKey = env["WEATHER_API_KEY"];

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
    this.time = this.formatDate(device.CURTIME);
  }

  private formatDate(time: string) {
    const format = "yyyy,MM,dd,HH,mm,ss";
    const TIME_IN_MILISECOND = 60000;
    const date = parse(time, format);
    const offSet = new Date().getTimezoneOffset() * TIME_IN_MILISECOND;
    const diff = (date.getTime() - offSet) / 1000;
    return diff;
  }
}

class Inverter extends BaseDatadog {
  lifetimePower: number | null;
  currentGeneration: number | null;

  constructor(device: PSVInverter) {
    super(device);
    this.lifetimePower = parseFloat(device.ltea_3phsum_kwh);
    this.currentGeneration = parseFloat(device.p_3phsum_kw);
  }
}

class Meter extends BaseDatadog {
  totalNetEnergy: number | undefined;

  constructor(device: PSVPowerMeter) {
    super(device);
    this.totalNetEnergy = parseInt(device.net_ltea_3phsum_kwh);
  }
}

async function getDeviceList(): Promise<APIResponse> {
  const response = await fetch(
    "http://192.168.0.68/cgi-bin/dl_cgi?Command=DeviceList",
  );
  const data = await response.json();
  return data;
}

type Devices = Inverter | Meter;
function formatDevices(devices: PSVDevices[]) {
  const something = devices.reduce(
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
  return something;
}

async function sendToDataDog(stats: Inverter) {
  const headers = new Headers({
    "DD-API-KEY": apiKey,
    "Content-Type": "application/json",
  });

  const body = JSON.stringify({
    series: [{
      metric: "solar.current.generation",
      type: 0,
      points: [
        { value: stats.currentGeneration, timestamp: stats.time },
      ],
      tags: stats.tags,
    }, {
      metric: "solar.lifetime.power",
      type: 0,
      points: [
        { value: stats.lifetimePower, timestamp: stats.time },
      ],
      tags: stats.tags,
    }],
  });

  const options: RequestInit = {
    method: "POST",
    headers,
    body,
    redirect: "follow",
  };

  // check = 'solar.status'
  // status = status
  // tags = ['{}:{}'.format(type, id)]

  // api.ServiceCheck.check(check=check, status=status, tags=tags)

  fetch("https://api.datadoghq.com/api/v2/series/", options)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}

function isInverter(device: Devices): device is Inverter {
  return device.type === "Inverter";
}

const deviceList = await getDeviceList();
const formatted = formatDevices(deviceList.devices);

const results: Inverter[] = Object.values(formatted)
  .filter(isInverter);

results.forEach((inverter) => {
  sendToDataDog(inverter);
});
