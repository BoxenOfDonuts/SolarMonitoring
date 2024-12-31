import { log } from "#log";
import { post } from "../conf/fetch.ts";

export interface MetricBody {
  metric: string;
  type: number;
  points: { value: number; timestamp: number }[];
  tags: string[];
}

export interface CheckBody {
  check: string;
  status: number;
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

  async sendChecks(body: CheckBody | CheckBody[]) {
    try {
      const response = await post(this.checkURL, body, this.headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending checks to datadog", error);
    }
  }

  async sendMetrics(series: MetricBody[]) {
    const body = { series };

    try {
      const response = await post(this.seriesURL, body, this.headers);
      log.debug(response);
    } catch (error) {
      log.error("error sending metrics to datadog", error);
    }
  }
}
