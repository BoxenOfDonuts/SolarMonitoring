# syntax=docker/dockerfile:1

FROM denoland/deno:alpine

# Timezone Stuff
RUN apk add --no-cache tzdata
ENV TZ=America/Chicago

WORKDIR /app

# prefer not to run as root
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY . /app
RUN deno cache deps.ts

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD deno task run