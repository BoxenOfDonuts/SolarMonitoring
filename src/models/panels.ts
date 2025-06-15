import { PanelQueryResponse, PanelQueryResponseAlert } from "./psv-types.d.ts";
import { parse } from "@std/datetime";

export default class Panel {
  serialNumber: string;
  alerts: PanelQueryResponseAlert[] | null;
  hourlyData: {
    timestamp: string;
    power: number;
    energy: number;
    powerColorCode: number;
  }[];
  status: number;
  tags: string[];

  constructor(panel: PanelQueryResponse["data"]["panels"]["panels"][number]) {
    this.serialNumber = panel.serialNumber;
    this.alerts = panel.alerts;
    this.hourlyData = panel.hourlyData;
    this.status = this.isAlerting(panel.alerts);
    this.tags = [`inverter:${panel.serialNumber}`];
  }

  private isAlerting(alerts: PanelQueryResponseAlert[] | null) {
    if (!alerts) return 0;
    if (alerts[0].alertType === "mySunPowerPanelTempNoCommunication") return 0;
    return alerts[0].alertStatus === "Open" ? 2 : 0;
  }

  // needed, but only for the one we are sending to datadog
  private formatDate(time: string) {
    const format = "yyyy-MM-ddTHH:mm:ss";
    const date = parse(time, format).getTime() / 1000;
    return date;
  }

  getMetricsBody() {
    const powerPoints = this.hourlyData.map((data) => ({
      value: data.power,
      timestamp: this.formatDate(data.timestamp),
    }));
    const energyPoints = this.hourlyData.map((data) => ({
      value: data.energy,
      timestamp: this.formatDate(data.timestamp),
    }));

    return [
      {
        metric: "solar.current.power",
        type: 0,
        points: powerPoints,
        tags: this.tags,
      },
      {
        metric: "solar.current.energy",
        type: 0,
        points: energyPoints,
        tags: this.tags,
      },
    ];
  }

  getCheckBody() {
    return {
      check: "solar.status",
      status: this.status,
      tags: this.tags,
    };
  }
}
