import { load } from "#deps";
const env = await load();

const apiKey = getEnv("DATADOG_API_KEY");
const appKey = getEnv("DATADOG_APP_KEY");
const weatherApiKey = getEnv("WEATHER_API_KEY");
const defaultSleep = 2 * 60 * 1000; // 2 minutes
const longSleep = 15 * 60 * 1000; // 1 hour
const oneHour = 60 * 60 * 1000; // 1 hour
const thirtyMinutes = 30 * 60 * 1000; // 30 minutes
const twoMinutes = 2 * 60 * 1000; // 2 minutes
const username = getEnv("UI_USERNAME");
const password = getEnv("UI_PASSWORD");
const siteKey = getEnv("SITE_KEY");

function getEnv(key: string): string {
  const result = env[key] || Deno.env.get(key);
  if (!result) {
    throw new Error(
      `Missing env var ${key}, make sure you have a .env file or you pass it in via the command line`
    );
  }
  return result;
}

export {
  apiKey,
  appKey,
  defaultSleep,
  oneHour,
  password,
  siteKey,
  thirtyMinutes,
  twoMinutes,
  username,
  weatherApiKey,
  longSleep,
};