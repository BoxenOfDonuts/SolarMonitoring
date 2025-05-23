export const getFullPanelData =
  `query Panels($date: String!, $siteKey: String!) {
    panels(date: $date, siteKey: $siteKey) {
      hasPanelLayout
      siteDailyEnergyProduction {
        timestamp
        value
        __typename
      }
      siteHourlyPowerProduction {
        timestamp
        value
        __typename
      }
      panels {
        serialNumber
        dailyEnergyProduction
        sevenDayAverage
        lastCommunicationTimestamp
        peakPowerProduction {
          timestamp
          value
          __typename
        }
        energyColorCode
        alerts {
          alertStatus
          deviceSerialNumber
          deviceType
          deviceKey
          alertId
          alertType
          eventTimestamp
          __typename
        }
        hourlyData {
          timestamp
          power
          energy
          powerColorCode
          __typename
        }
        layout {
          xCoordinate
          yCoordinate
          rotation
          azimuth
          orientation
          __typename
        }
        __typename
      }
      weather {
        days {
          conditions
          datetime
          datetimeEpoch
          maxTemperature
          minTemperature
          sunrise
          sunset
          hours {
            conditions
            datetime
            datetimeEpoch
            temperature
            __typename
          }
          __typename
        }
        timezone
        tzoffset
        __typename
      }
      __typename
    }
  }`;

export const getPartialPanelData = (date: string, siteKey: string) => {
  return {
    query: `query Panels($date: String!, $siteKey: String!) {
    panels(date: $date, siteKey: $siteKey) {
        siteHourlyPowerProduction {
        timestamp
        value
        __typename
        }
        panels {
        serialNumber
        lastCommunicationTimestamp
        alerts {
            alertStatus
            deviceSerialNumber
            deviceType
            deviceKey
            alertId
            alertType
            eventTimestamp
            __typename
        }
        hourlyData {
            timestamp
            power
            energy
            __typename
        }
        __typename
        }
        __typename
    }
    }
    `,
    variables: {
      date,
      siteKey,
    },
  };
};

export const getFullDataSeries = (
  start: string,
  end: string,
  interval: string,
  siteKey: string,
) => {
  return {
    query:
      `query FetchPowerData($interval: String!, $end: String!, $start: String!, $siteKey: String!) {
    power(interval: $interval, end: $end, start: $start, siteKey: $siteKey) {
      powerDataSeries {
        production
      }
    }
    energyRange(interval: $interval, end: $end, start: $start, siteKey: $siteKey) {
      energyDataSeries {
        production
      }
    }
  }`,
    variables: {
      start,
      end,
      interval,
      siteKey,
    },
  };
};

export const getFullData = (
  start: string,
  end: string,
  interval: string,
  date: string,
  siteKey: string,
) => {
  return {
    query: `
    query FetchData(
    $interval: String!
    $end: String!
    $start: String!
    $date: String!
    $siteKey: String!
) {
    power(interval: $interval, end: $end, start: $start, siteKey: $siteKey) {
        powerDataSeries {
            production
        }
    }
    energyRange(interval: $interval, end: $end, start: $start, siteKey: $siteKey) {
        energyDataSeries {
            production
        }
    }
    panels(date: $date, siteKey: $siteKey) {
        siteHourlyPowerProduction {
            timestamp
            value
            __typename
        }
        panels {
            serialNumber
            lastCommunicationTimestamp
            alerts {
                alertStatus
                deviceSerialNumber
                deviceType
                deviceKey
                alertId
                alertType
                eventTimestamp
                __typename
            }
            hourlyData {
                timestamp
                power
                energy
                __typename
            }
            __typename
        }
    }
}`,
    variables: {
      start,
      end,
      interval,
      date,
      siteKey,
    },
  };
};
