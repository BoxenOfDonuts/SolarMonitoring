import { load } from "@std/dotenv";
const env = await load();

const apiKey = getEnv("DATADOG_API_KEY");
const appKey = getEnv("DATADOG_APP_KEY");
const weatherApiKey = getEnv("WEATHER_API_KEY");
const weatherLocation = getEnv("WEATHER_LOCATION");
const defaultSleep = 2 * 60 * 1000; // 2 minutes
const queryInterval = getQueryInterval();
const oneHour = 60 * 60 * 1000; // 1 hour
const thirtyMinutes = 30 * 60 * 1000; // 30 minutes
const twoMinutes = 2 * 60 * 1000; // 2 minutes
const username = getEnv("UI_USERNAME");
const password = getEnv("UI_PASSWORD");
const siteKey = getEnv("SITE_KEY");
const DENO_ENV = getOptionalEnv("DENO_ENV", "PRODUCTION");
const SERVER_INFO_VENDOR = getOptionalEnv("SERVER_INFO_VENDOR", "deno") as
  | "deno"
  | "docker";

function getEnv(key: string): string {
  const result = env[key] || Deno.env.get(key);
  if (!result) {
    throw new Error(
      `Missing env var ${key}, make sure you have a .env file or you pass it in via the command line`
    );
  }
  return result;
}

function getOptionalEnv<T extends string | number>(
  key: string,
  defaultValue: T
): T {
  return (env[key] || Deno.env.get(key) || defaultValue) as T;
}

function getQueryInterval() {
  let queryInterval = getOptionalEnv("QUERY_INTERVAL", 15);
  if (isNaN(Number(queryInterval))) {
    queryInterval = 15;
  }
  return queryInterval * 60 * 1000;
}

export {
  apiKey,
  appKey,
  defaultSleep,
  DENO_ENV,
  queryInterval,
  oneHour,
  password,
  SERVER_INFO_VENDOR,
  siteKey,
  thirtyMinutes,
  twoMinutes,
  username,
  weatherApiKey,
  weatherLocation,
};
