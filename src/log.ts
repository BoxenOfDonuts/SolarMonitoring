import * as log from "https://deno.land/std/log/mod.ts";

await log.setup({
  //define handlers
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      // formatter: "{datetime} {levelName} {msg}",
      formatter: (rec) =>
        JSON.stringify({
          ts: rec.datetime,
          level: rec.levelName,
          data: rec.msg,
        }),
    }),
  },
  //assign handlers to loggers
  loggers: {
    default: {
      level: "INFO",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

export { logger as log };
