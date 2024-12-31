# syntax=docker/dockerfile:1

FROM denoland/deno:alpine

# Timezone Stuff
RUN apk add --no-cache tzdata
ENV TZ=America/Chicago \
    SERVER_INFO_VENDOR=docker \
    DENO_ENV=production


WORKDIR /app

# prefer not to run as root
USER deno

COPY . /app
RUN deno install --entrypoint main.ts


CMD ["task", "run"]
