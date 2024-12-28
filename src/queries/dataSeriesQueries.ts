export const getFullDataSeries = (
  start: string,
  end: string,
  interval: string,
  siteKey: string
) => {
  return {
    query: `query FetchPowerData($interval: String!, $end: String!, $start: String!, $siteKey: String!) {
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
