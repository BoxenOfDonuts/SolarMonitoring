# syntax=docker/dockerfile:1

FROM denoland/deno:alpine

# Timezone Stuff
RUN apk add --no-cache tzdata
ENV TZ=America/Chicago

WORKDIR /app

# prefer not to run as root
USER deno

COPY . /app

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD deno task run