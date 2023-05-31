import { weatherApiKey } from "./constants.ts";
import { get } from "./fetch.ts";

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


async function getWeather() {
  const params = new URLSearchParams([
    ["units", "imperial"],
    ['zip', '63110,us'],
    ['appId', `${weatherApiKey}`]
  ]);

  const URL =
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;
  
  try {
    const result = await get(URL) as WeatherData;
    const { sunrise, sunset } = result.sys
    return { sunrise, sunset }
  } catch (error) {
    console.log("error", error);
  }
}

console.log( await getWeather());
