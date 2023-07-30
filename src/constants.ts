import { load } from "#deps";
const env = await load();

const apiKey = env["DATADOG_API_KEY"];
const appKey = env["DATADOG_APP_KEY"];
const weatherApiKey = env["WEATHER_API_KEY"];
const defaultSleep = 2 * 60 * 1000; // 2 minutes
const itsDarkSleep = 60 * 60 * 1000; // 1 hour
const thirtyMinutes = 30 * 60 * 1000; // 30 minutes

export {
  apiKey,
  appKey,
  defaultSleep,
  itsDarkSleep,
  thirtyMinutes,
  weatherApiKey,
};
