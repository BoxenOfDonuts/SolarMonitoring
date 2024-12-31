import { PanelQueryResponse } from "./psv-types.d.ts";
import { post } from "../conf/fetch.ts";
import { log } from "#log";
import { apiKey } from "#constants";
import { parse } from "@std/datetime";

export default class Panel {
  serialNumber: string;
  alerts: {
    alertStatus: any;
    deviceSerialNumber: string;
    deviceType: any;
    deviceKey: any;
    alertId: any;
    alertType: any;
    eventTimestamp: string;
  };
  hourlyData: {
    timestamp: string;
    power: number;
    energy: number;
    powerColorCode: number;
  }[];
  status: number;
  tags: string[];
  currentPower: number;
  currentEnergy: number;
  time: number;

  constructor(panel: PanelQueryResponse["data"]["panels"]["panels"][number]) {
    this.serialNumber = panel.serialNumber;
    this.alerts = panel.alerts;
    this.hourlyData = panel.hourlyData;
    this.status = panel.alerts ? 2 : 0;
    this.tags = [`inverter:${panel.serialNumber}`];

    this.currentPower = panel.hourlyData?.at(-1)?.power ?? 0;
    this.currentEnergy = panel.hourlyData?.at(-1)?.energy ?? 0;
    this.time = this.formatDate(panel.hourlyData?.at(-1)?.timestamp ?? "");
  }

  // needed, but only for the one we are sending to datadog
  private formatDate(time: string) {
    const format = "yyyy-MM-ddTHH:mm:ss";
    const date = parse(time, format).getTime() / 1000;
    return date;
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

  async sendMetrics() {
    const url = "https://api.datadoghq.com/api/v2/series/";
    const headers = new Headers({
      "DD-API-KEY": apiKey,
      "Content-Type": "application/json",
    });

    const body = {
      series: [
        {
          metric: "solar.current.power",
          type: 0,
          points: [{ value: this.currentPower, timestamp: this.time }],
          tags: this.tags,
        },
        {
          metric: "solar.current.energy",
          type: 0,
          points: [{ value: this.currentEnergy, timestamp: this.time }],
          tags: this.tags,
        },
        // {
        //   metric: "solar.lifetime.power",
        //   type: 0,
        //   points: [{ value: this.lifetimePower, timestamp: this.time }],
        //   tags: this.tags,
        // },
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
