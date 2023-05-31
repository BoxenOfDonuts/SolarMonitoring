import { load } from "https://deno.land/std@0.188.0/dotenv/mod.ts";
const env = await load();

const apiKey = env["DATADOG_API_KEY"];
const appKey = env["DATADOG_APP_KEY"];
const weatherApiKey = env["WEATHER_API_KEY"];

export {
  apiKey,
  appKey,
  weatherApiKey
}