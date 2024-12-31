import * as log from "@std/log";
import { format } from "@std/datetime";
import { DENO_ENV, SERVER_INFO_VENDOR } from "#constants";

const logLevel = DENO_ENV === "DEV" ? "DEBUG" : "INFO";
const useColors = SERVER_INFO_VENDOR === "docker" ? false : true;

function flattenArgs(args: unknown[]): unknown {
  if (args.length === 1) {
    return args[0];
  } else if (args.length > 1) {
    return args;
  }
}

function flattenError(args: [Error]) {
  return args[0]?.message;
}

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (record) => {
        const base = `${record.levelName} ${
          format(record.datetime, "yyyy-MM-dd HH:mm:ss")
        } ${record.msg}`;
        if (record.args.length) {
          if (record.levelName === "ERROR") {
            return `${base} ${flattenError(record.args as [Error])}`;
          }
          return `${base} ${JSON.stringify(flattenArgs(record.args))}`;
        }
        return base;
      },
      useColors,
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
