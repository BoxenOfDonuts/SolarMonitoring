// sunpower wrapper
import { post } from "./fetch.ts";
import { GQLResponse } from "./psv-types.d.ts";
import { getPartialPanelData } from "./queries/panelQueries.ts";
import { format } from "#deps";
import { log } from "./log.ts";

type Config = {
  username: string;
  password: string;
  siteKey: string;
  token?: string;
  tokenExpire?: number;
};

export default class SunPower {
  private username: string;
  private password: string;
  private siteKey: string;
  private token: string | null = null;
  private tokenExpire: number | null = null;

  constructor(config: Config) {
    this.username = config.username;
    this.password = config.password;
    this.siteKey = config.siteKey;
    this.token = config.token || null;
    this.tokenExpire = config.tokenExpire || null;
  }

  async login() {
    log.debug("Logging in");

    const url = "https://edp-api.edp.sunpower.com/v1/auth/okta/signin";
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
      `Logged in! Token expires at ${new Date(
        this.tokenExpire
      ).toLocaleString()}`
    );
  }

  private async refreshTokenIfNeeded() {
    if (!this.token || (this.tokenExpire && Date.now() >= this.tokenExpire)) {
      log.debug("Token expired, refreshing");
      await this.login();
    }
  }

  async getPanelData(): Promise<GQLResponse> {
    log.debug("Getting panel data");
    await this.refreshTokenIfNeeded(); // Check if token needs to be refreshed

    const date = format(new Date(), "yyyy-MM-dd");
    const url = "https://edp-api-graphql.edp.sunpower.com/graphql";
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    });
    const body = getPartialPanelData(date, this.siteKey);

    const data = (await post(url, body, headers)) as GQLResponse;
    log.debug("Got panel data", { data });
    return data;
  }
}
