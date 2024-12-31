import SunPower from "./models/sunpower.ts";
import Sun from "./models/sun.ts";
import Panel from "./models/panels.ts";
import { CheckBody, MetricBody } from "./models/datadog.ts";
import BaseDatadog from "./models/datadog.ts";
import {
  apiKey,
  longSleep,
  oneHour,
  password,
  siteKey,
  username,
} from "#constants";
import { log } from "#log";
import { parse } from "@std/datetime";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function timeLeftInDay(): number {
  const now = Date.now();
  const midnight = new Date().setHours(24, 0, 0, 0);
  return midnight - now;
}

function formatDate(time: string): number {
  const format = "yyyy-MM-ddTHH:mm:ss";
  return parse(time, format).getTime() / 1000;
}

function formatSeriesForDatadog(
  series: [string, string, string][],
  metric: string,
  tags: string[],
): {
  metric: string;
  type: number;
  points: { value: number; timestamp: number }[];
  tags: string[];
}[] {
  if (!series || !Array.isArray(series) || series.length === 0) {
    log.error("No series data or invalid format");
    return [];
  }

  return series.reduce(
    (acc, [timestamp, value]) => {
      acc.push({
        metric,
        type: 0,
        points: [{
          value: parseFloat(value),
          timestamp: formatDate(timestamp),
        }],
        tags,
      });
      return acc;
    },
    [] as {
      metric: string;
      type: number;
      points: { value: number; timestamp: number }[];
      tags: string[];
    }[],
  );
}

function formatPanelDataForDatadog(
  panels: Panel[],
): { series: MetricBody[]; checks: CheckBody[] } {
  return panels.reduce((dataObj, panel) => {
    dataObj.checks.push(panel.getCheckBody());
    dataObj.series.push(...panel.getMetricsBody());
    return dataObj;
  }, {
    checks: [] as CheckBody[],
    series: [] as MetricBody[],
  });
}

async function sendMetrics(): Promise<void> {
  try {
    const { data } = await Client.getData();

    if (data?.panels?.panels.length > 0) {
      const panels = data.panels.panels.map((panel) => {
        return new Panel(panel);
      });
      const { series, checks } = formatPanelDataForDatadog(panels);
      Dog.sendMetrics(series);
      Dog.sendChecks(checks);
    } else {
      log.error("No panel data found");
    }

    const productionData = data?.power?.powerDataSeries?.production || [];
    const energyData = data?.energyRange?.energyDataSeries?.production || [];

    if (productionData.length === 0 || energyData.length === 0) {
      log.error("Missing site power or site energy data");
    }

    const productionSeries = formatSeriesForDatadog(
      productionData,
      "solar.current.power",
      ["site:power"],
    );
    const energySeries = formatSeriesForDatadog(
      energyData,
      "solar.current.energy",
      ["site:energy"],
    );

    Dog.sendMetrics([...productionSeries, ...energySeries]);
  } catch (error) {
    log.error("Error in sendMetrics:", error);
  }
}

export async function main(): Promise<void> {
  log.info("Getting sunrise and sunset");
  await sun.initialize();
  log.info("Starting main loop");
  while (true) {
    try {
      const now = Date.now();
      if (now > sun.sunrise && now < sun.sunset) {
        await sendMetrics();
        log.debug(
          `Sent metrics, sleeping for ${longSleep / 1000 / 60} minutes`,
        );
        await sleep(longSleep);
      } else if (now > sun.sunset) {
        log.debug(
          "Not sending metrics, it's dark. Sleeping till tomorrow at 1 am",
        );
        const sleepTime = timeLeftInDay() + oneHour;
        await sleep(sleepTime);
        await sun.update();
      } else if (now < sun.sunrise) {
        const sleepTime = sun.sunrise - Date.now();
        log.debug("Not sending metrics, it's dark. Sleeping until sunrise");
        await sleep(sleepTime);
      }
    } catch (error) {
      log.error("Error in main loop:", error);
      await sleep(10000); // Optional: wait a bit before retrying
    }
  }
}

const Client = new SunPower({
  username,
  password,
  siteKey,
  token:
    "eyJraWQiOiJobUptSTdpa3p6R2NkUHpidDhybGJVWkJGS3hiRk1YUDBmZ3REZm51MlZFIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULlZUMmR5Ty1CTTUwRUUzc3JIYzZOS1owUVhBY2hwR0JCT2pMY0NyOUUwQ28iLCJpc3MiOiJodHRwczovL3N1bnBvd2VyLm9rdGEuY29tL29hdXRoMi9hdXMxaW0yNmJxYW5kekNOTDBoOCIsImF1ZCI6ImVkcGFwaSIsImlhdCI6MTczNTY2Njg2MCwiZXhwIjoxNzM1NzUzMjYwLCJjaWQiOiIwb2ExaW0yNWYzZEpTb0FWZDBoOCIsInVpZCI6IjAwdTFsaDJkemNnbm5vek5tMGg4Iiwic2NwIjpbIm9wZW5pZCJdLCJhdXRoX3RpbWUiOjE3MzU2NjY4NjAsInN1YiI6ImpvZWwuaGFja2VAZ21haWwuY29tIiwiaXNBZG1pbiI6ZmFsc2UsInBhcnR5SWQiOiJVXzIwMjUxNCIsInVzZXJHcm91cCI6Im15U3VuUG93ZXIifQ.WfmBoJmFp_b4fzkq-ErQ8JwgGdapddYMo-JsA7qW64JBhZjLasymbQosSeXS-qrLkLU_PrMZhm9dkkaCjPRtRfq7fr_XICEI8cgjQo0lqLnQHrto9sBvV6FG4zJ5tVd-4YLxVxCOVpJ7xMvsEkloIT-W2485XRmfaegzhtsPCXgf0ZUAFyhJT3uWVlRJlinBUyGiJuj6H3Pplo3LFwT1-xIn9dUPJxQS8171BlbwOwayKfKv69J3PIIv_I71GvwfvHiV0kcLe82QkrFB_w43P18E0r-GZXHBi8loB2q39CAGgXqDdQu2z4afuY5q6rRQyGUm0fVenbKbDcSLYJP0Rg",
  tokenExpire: 1735753260488,
});
const Dog = new BaseDatadog({ apiKey });
const sun = new Sun();

if (import.meta.main) {
  log.info("Starting script");
  main();
}
