import { apiKey } from "./constants.ts";
import { post } from "./fetch.ts";

class Api {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static createHeaders() {
    return new Headers({
      "DD-API-KEY": apiKey,
      "Content-Type": "application/json",
    });
  }
}

class Metrics extends Api {
  seriesUrl = "https://api.datadoghq.com/api/v2/series/";
  public async sendMetric(body) {
    const headers = Api.createHeaders();
    try {
      return post(this.seriesUrl, body, headers);
    } catch (error) {
      console.log("error sending metric to datadog", error);
    }
  }
}

export { Metrics };
