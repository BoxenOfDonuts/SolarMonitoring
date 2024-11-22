### signing in

Will have to come up with a way to continously auth

```
const url = "https://edp-api.edp.sunpower.com/v1/auth/okta/signin";

// wont need to stringify with helper
const body = JSON.stringify({
  "password": "",
  "username": "",
  "options": {
    "warnBeforePasswordExpired": true,
    "multiOptionalFactorEnroll": true,
  },
});

const r = await fetch(url, { method: "POST", headers, body });
const auth = await r.json();

const { expires_in, access_token } = auth;
```

### Query For Pannels

Don't need all the stuff in the query, but cool to have just in case

```
const data = JSON.stringify({
  query: `query Panels($date: String!, $siteKey: String!) {
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
}`,
  variables: {
    date: "2024-11-21",
    siteKey: "-----",
  },
});
```

### thoughts

Check will probably have to change to if we get back anything from alert
attribute. Currenty is null but could return an object. Could also check if the
`lastCommunicationTimestamp` is over a certain threshold

```
{
  data: {
    panels: {
      panels: [
        serialNumber: ...
        lastCommunicationTimestamp: ...
        alerts: ...
      ]
    }
  }
}
```
