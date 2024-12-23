import { thirtyMinutes, weatherApiKey, weatherLocation } from "#constants";
import { log } from "#log";
import { get } from "../conf/fetch.ts";

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

export default class Sun {
  sunrise: number = new Date().setHours(6, 0, 0, 0);
  sunset: number = new Date().setHours(21, 0, 0, 0);

  constructor(sunrise?: number, sunset?: number) {
    // theres usually light for 30 minutes before sunrise and after sunset
    if (sunrise && sunset) {
      this.sunrise = sunrise - thirtyMinutes;
      this.sunset = sunset + thirtyMinutes;
    }
  }

  async getWeather(): Promise<
    | { sunrise: number; sunset: number }
    | Record<string | number | symbol, never>
  > {
    const params = new URLSearchParams([
      ["units", "imperial"],
      ["zip", `${weatherLocation}`],
      ["appId", `${weatherApiKey}`],
    ]);

    const URL = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;

    try {
      const result = (await get(URL)) as WeatherData;
      let { sunrise, sunset } = result.sys;
      // returns in seconds not milliseconds
      sunrise *= 1000;
      sunset *= 1000;
      return { sunrise, sunset };
    } catch (error) {
      log.error(error);
      return {};
    }
  }

  async update() {
    const { sunrise, sunset } = await this.getWeather();
    if (!sunrise || !sunset) {
      log.error("No sunrise or sunset, using yesterday's values");
      return;
    }
    this.sunrise = sunrise - thirtyMinutes;
    this.sunset = sunset + thirtyMinutes;
  }

  async initialize() {
    await this.update();
  }
}
