import { main } from "./src/sunpower.ts";
import { log } from "#log";

if (import.meta.main) {
  log.info("Starting sunpower script");
  main();
}
