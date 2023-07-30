import { log } from "#deps";

await log.setup({
  //define handlers
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "{datetime} {levelName} {msg}",
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
