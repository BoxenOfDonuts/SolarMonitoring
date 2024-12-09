import SunPower from "./src/sunpower.ts";
import { Panel } from "./src/panels.ts";
import {
  longSleep,
  oneHour,
  password,
  thirtyMinutes,
  username,
  siteKey,
} from "./src/constants.ts";
import { log } from "./src/log.ts";
import { getWeather } from "./src/weather.ts";

class Sun {
  sunrise: number;
  sunset: number;

  constructor(sunrise: number, sunset: number) {
    // theres usually light for 30 minutes before sunrise and after sunset
    this.sunrise = sunrise - thirtyMinutes;
    this.sunset = sunset + thirtyMinutes;
  }

  async update() {
    const { sunrise, sunset } = await getWeather();
    if (!sunrise || !sunset) {
      log.error("No sunrise or sunset, using yesterday's values");
      return;
    }
    this.sunrise = sunrise - thirtyMinutes;
    this.sunset = sunset + thirtyMinutes;
  }
}

function timeLeftInDay() {
  const now = Date.now();
  const midnight = new Date().setHours(24, 0, 0, 0);
  return midnight - now;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const results = await Client.getPanelData();

  const panels = results.data.panels.panels.map((panel) => {
    return new Panel(panel);
  });

  panels.forEach((panel) => {
    panel.sendCheck();
    panel.sendMetrics();
  });
}

const Client = new SunPower({ username, password, siteKey });

if (import.meta.main) {
  log.info("Starting script");
  const sun = new Sun(0, 0);
  log.info("Getting sunrise and sunset ");
  await sun.update();
  log.info("Staring main loop");
  while (true) {
    const now = Date.now();
    if (now > sun.sunrise && now < sun.sunset) {
      main();
      log.debug(`sent metrics, sleeping for ${longSleep / 1000 / 60} minutes`);
      await sleep(longSleep);
    } else if (now > sun.sunset) {
      log.debug(
        `not sending metrics, it's dark. Sleeping till tomorrow at 1 am`
      );
      const sleepTime = timeLeftInDay() + oneHour;
      await sleep(sleepTime);
      await sun.update();
    } else if (now < sun.sunrise) {
      const sleepTime = sun.sunrise - Date.now();
      log.debug(`not sending metrics, it's dark. Sleeping until sunrise`);
      await sleep(sleepTime);
    }
  }
}
