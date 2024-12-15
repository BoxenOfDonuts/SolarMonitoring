import SunPower from "./models/sunpower.ts";
import Sun from "./models/sun.ts";
import Panel from "./models/panels.ts";
import BaseDatadog from "./models/datadog.ts";
import {
  longSleep,
  oneHour,
  password,
  username,
  siteKey,
  apiKey,
} from "#constants";
import { log } from "#log";
import { parse } from "#deps";

function timeLeftInDay() {
  const now = Date.now();
  const midnight = new Date().setHours(24, 0, 0, 0);
  return midnight - now;
}

function formatDate(time: string) {
  const format = "yyyy-MM-ddTHH:mm:ss";
  const date = parse(time, format).getTime() / 1000;
  return date;
}

function formatSeriesForDD(
  series: [string, string, string][],
  metric: string,
  tags: string[]
) {
  return series.reduce(
    (acc, series) => {
      const [timestamp, value, _] = series;
      acc.push({
        metric,
        type: 0,
        points: [
          { value: parseFloat(value), timestamp: formatDate(timestamp) },
        ],
        tags,
      });
      return acc;
    },
    [] as {
      metric: string;
      type: number;
      points: { value: number; timestamp: number }[];
      tags: string[];
    }[]
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendMetrics() {
  const [panelData, siteData] = await Promise.all([
    Client.getPanelData(),
    Client.getSeriesData(),
  ]);

  const panels = panelData.data.panels.panels.map((panel) => {
    return new Panel(panel);
  });

  const productionSeries = formatSeriesForDD(
    siteData.data.power.powerDataSeries.production,
    "solar.current.power",
    ["site:power"]
  );
  const energySeries = formatSeriesForDD(
    siteData.data.energyRange.energyDataSeries.production,
    "solar.current.energy",
    ["site:energy"]
  );

  panels.forEach((panel) => {
    panel.sendCheck();
    panel.sendMetrics();
  });

  Dog.sendMetrics(productionSeries.concat(energySeries));
}

export async function main() {
  log.info("Getting sunrise and sunset ");
  await sun.initialize();
  log.info("Staring main loop");
  while (true) {
    const now = Date.now();
    if (now > sun.sunrise && now < sun.sunset) {
      sendMetrics();
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

const Client = new SunPower({
  username,
  password,
  siteKey,
});

const Dog = new BaseDatadog({ apiKey: apiKey });
const sun = new Sun();

if (import.meta.main) {
  log.info("Starting script");
  main();
}
