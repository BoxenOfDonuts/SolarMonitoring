import { log } from "#log";
import { post } from "../conf/fetch.ts";

interface MetricBody {
  metric: string;
  type: number;
  points: { value: number; timestamp: number }[];
  tags: string[];
}

export default class BaseDatadog {
  checkURL: string = "https://api.datadoghq.com/api/v1/check_run";
  seriesURL: string = "https://api.datadoghq.com/api/v2/series/";
  apiKey: string;
  headers: Headers;

  constructor(opts: { apiKey: string }) {
    this.apiKey = opts.apiKey;
    if (!this.apiKey) {
      throw new Error("missing apiKey");
    }

    this.headers = new Headers({
      "DD-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    });
  }

  async sendCheck(body: any) {
    try {
      const response = await post(this.checkURL, body, this.headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending check to datadog", error);
    }
  }

  async sendMetrics(series: MetricBody[]) {
    const body = { series };

    try {
      const response = await post(this.seriesURL, body, this.headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending metric to datadog", error);
    }
  }
}
