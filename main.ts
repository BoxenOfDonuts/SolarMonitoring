import { parse } from "https://deno.land/std@0.188.0/datetime/mod.ts";
import { post } from "./src/fetch.ts";
import { apiKey } from "./src/constants.ts";
// tomorrow - look at deno tasks to pass in the .env file
// maybe spit some of this into other files
// need to do the checks

import type {
  APIResponse,
  PSVDevices,
  PSVInverter,
  PSVPowerMeter,
} from "./psv-types.d.ts";

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
}

class Inverter extends BaseDatadog {
  lifetimePower: number;
  currentGeneration: number;

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
  const url = "https://api.datadoghq.com/api/v2/series/";
  const headers = new Headers({
    "DD-API-KEY": apiKey,
    "Content-Type": "application/json",
  });

  const body = {
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
  };

  try {
    const response = await post(url, body, headers);
    console.log(response)
  } catch (error) {
    console.log("error sending metric to datadog", error);
  }
}

async function sendCheck(stat: Devices) {
  const headers = new Headers({
    "DD-API-KEY": apiKey,
    "Content-Type": "application/json",
  });

  const body = {
    check: "solar.status",
    status: stat.status,
    tags: stat.tags,
  };

  const url = "https://api.datadoghq.com/api/v1/check_run";

  try {
    const response = await post(url, body, headers);
    console.log(response)
  } catch (error) {
    console.log("error sending check to datadog", error);
  }
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
  sendCheck(inverter);
});
