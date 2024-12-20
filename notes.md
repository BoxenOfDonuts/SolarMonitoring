### 

In sunpower when querying the date range, probably need to back the end date up
to the nearest 5 minute mark. Sometimes when we query it has 0 [x]

Also might be good to make log level configurable [x]

Be able to choose if it starts psv6 or sunpower ?

### updates for config / constants

create config / contants file. Export config, then can use it like
`config.apiKey` in places maybe keep it as object? idk

```javascript
// config.ts

import { load } from '#deps'

const env = await load();

function getEnv() {
    ...
}

function getOptionalEnv() {
    ...
}

export { getEnv, getOptionalEnv }
```

```javascript
// constants.ts
import { getEnv, getOptionalEnv } from "./config.ts";

const config = {
    apiKey: getEnv(...),
    ...
}

export default config
```
