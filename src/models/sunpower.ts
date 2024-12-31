// sunpower wrapper
import { post } from "../conf/fetch.ts";
import { DataSeriesResponse, PanelQueryResponse } from "./psv-types.d.ts";
import { getPartialPanelData } from "../queries/panelQueries.ts";
import { getFullDataSeries } from "../queries/dataSeriesQueries.ts";
import { format } from "@std/datetime";
import { log } from "#log";

type Config = {
  username: string;
  password: string;
  siteKey: string;
  token?: string;
  tokenExpire?: number;
};

type GraphQLRequestBody = {
  query: string;
  variables?: { [key: string]: any };
};

type GraphQLResponse = PanelQueryResponse | DataSeriesResponse;

export default class SunPower {
  private username: string;
  private password: string;
  private siteKey: string;
  private token: string | null = null;
  private tokenExpire: number | null = null;
  private graphqlURL: string =
    "https://edp-api-graphql.edp.sunpower.com/graphql";
  private loginURL: string =
    "https://edp-api.edp.sunpower.com/v1/auth/okta/signin";
  private isLoggingIn: boolean = false; // Mutex flag
  private loginPromise: Promise<void> | null = null; // Promise to track login

  constructor(config: Config) {
    this.username = config.username;
    this.password = config.password;
    this.siteKey = config.siteKey;
    this.token = config.token || null;
    this.tokenExpire = config.tokenExpire || null;
  }

  async login() {
    log.debug("Logging in");

    const url = this.loginURL;
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    const body = JSON.stringify({
      password: this.password,
      username: this.username,
      options: {
        warnBeforePasswordExpired: true,
        multiOptionalFactorEnroll: true,
      },
    });

    const r = await fetch(url, { method: "POST", headers, body });
    const auth = await r.json();

    const { expires_in, access_token } = auth;

    this.token = access_token;
    // expires in 24 hours in seconds
    this.tokenExpire = Date.now() + expires_in * 1000; // Convert expires_in to milliseconds
    log.debug(
      `Logged in! Token expires at ${
        new Date(
          this.tokenExpire,
        ).toLocaleString()
      }`,
    );
  }

  private async refreshTokenIfNeeded() {
    if (!this.token || (this.tokenExpire && Date.now() >= this.tokenExpire)) {
      if (this.isLoggingIn) {
        log.debug("Waiting for login to complete");
        await this.loginPromise;
      } else {
        log.debug("Login needed, locking");
        this.isLoggingIn = true;
        this.loginPromise = this.login();
        await this.loginPromise;
        this.isLoggingIn = false;
        this.loginPromise = null;
      }
    }
  }

  private formatDate(time: Date): string {
    const dateFormat = "yyyy-MM-ddTHH:mm:ss";
    const date = format(time, dateFormat);
    return date;
  }

  private getDateRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now);
    // ui always just queries for the current day
    // but the api does support any start / end date
    start.setHours(start.getHours() - 1, 0, 0, 0);
    // start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setMinutes(end.getMinutes() - (end.getMinutes() % 5), 0, 0);

    return {
      start: this.formatDate(start),
      end: this.formatDate(end),
    };
  }

  async fetchData(
    body: GraphQLRequestBody,
    retries: number = 1,
  ): Promise<GraphQLResponse> {
    log.debug("Fetching data", { remainingRetries: retries });

    if (retries < 0) {
      throw new Error("Failed to fetch data, too many retries");
    }

    await this.refreshTokenIfNeeded();

    const url = this.graphqlURL;
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    });

    const data = (await post(url, body, headers)) as GraphQLResponse;

    // maybe move token refresh and this to fetch interceptor
    if (data?.errors?.[0]?.extensions?.code === "UNAUTHENTICATED") {
      log.debug("Token expired, refreshing and retrying");
      this.token = null;
      return this.fetchData(body, retries - 1);
    }

    if (data?.errors) {
      log.error("Error fetching data", { errors: data.errors });
      // throw new Error("Failed to fetch data");
    }

    return data;
  }

  async getPanelData(): Promise<PanelQueryResponse> {
    log.debug("Getting panel data");

    const date = format(new Date(), "yyyy-MM-dd");
    const body = getPartialPanelData(date, this.siteKey);

    const data = (await this.fetchData(body)) as PanelQueryResponse;
    log.debug("Got panel data", { data });

    return data;
  }

  async getSeriesData(): Promise<DataSeriesResponse> {
    log.debug("Getting series data");

    const { start, end } = this.getDateRange();
    const interval = "five_minute";

    const body = getFullDataSeries(start, end, interval, this.siteKey);

    const data = (await this.fetchData(body)) as DataSeriesResponse;
    log.debug("Got series data", { data });

    return data;
  }
}
