import { log } from "#deps";
import { DENO_ENV } from "#constants";

await log.setup({
  //define handlers
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{levelName} {datetime} {msg}",
    }),
  },
  //assign handlers to loggers
  loggers: {
    default: {
      level: DENO_ENV === "DEV" ? "DEBUG" : "INFO",
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

export { logger as log };
