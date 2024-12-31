import * as log from "@std/log";
import { format } from "@std/datetime";
import { DENO_ENV, SERVER_INFO_VENDOR } from "#constants";

const logLevel = DENO_ENV === "DEV" ? "DEBUG" : "INFO";
const loggerType = SERVER_INFO_VENDOR === "docker" ? "docker" : "default";

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (record) =>
        `${record.levelName} ${
          format(record.datetime, "yyyy-MM-dd HH:mm:ss")
        } ${record.msg}`,
    }),
  },
  //assign handlers to loggers
  loggers: {
    default: {
      level: logLevel,
      handlers: ["console"],
    },
  },
});

const logger = log.getLogger();

export { logger as log };
