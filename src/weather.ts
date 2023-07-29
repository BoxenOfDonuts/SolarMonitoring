import { weatherApiKey } from "./constants.ts";
import { get } from "./fetch.ts";
import { log } from "./log.ts";

interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export async function getWeather(): Promise<
  { sunrise: number; sunset: number } | Record<string | number | symbol, never>
> {
  const params = new URLSearchParams([
    ["units", "imperial"],
    ["zip", "63110,us"],
    ["appId", `${weatherApiKey}`],
  ]);

  const URL =
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;

  try {
    const result = await get(URL) as WeatherData;
    let { sunrise, sunset } = result.sys;
    // returns in seconds not miliseconds
    sunrise *= 1000;
    sunset *= 1000;
    return { sunrise, sunset };
  } catch (error) {
    log.error(error);
    return {};
  }
}

if (import.meta.main) {
  log.info(await getWeather());
}
