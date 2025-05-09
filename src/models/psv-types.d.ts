type PSVInverter = {
  ISDETAIL: boolean;
  SERIAL: string;
  TYPE: string;
  STATE: string;
  STATEDESCR: string;
  MODEL: string;
  DESCR: string;
  DEVICE_TYPE: string;
  hw_version: string;
  interface: string;
  module_serial: string;
  PANEL: string;
  slave: number;
  SWVER: string;
  PORT: string;
  MOD_SN: string;
  NMPLT_SKU: string;
  DATATIME: string;
  ltea_3phsum_kwh: string;
  p_3phsum_kw: string;
  vln_3phavg_v: string;
  i_3phsum_a: string;
  p_mppt1_kw: string;
  v_mppt1_v: string;
  i_mppt1_a: string;
  t_htsnk_degc: string;
  freq_hz: string;
  stat_ind: string;
  origin: string;
  OPERATION: string;
  CURTIME: string;
};

type PSVPowerMeter = {
  ISDETAIL: boolean;
  SERIAL: string;
  TYPE: string;
  STATE: string;
  STATEDESCR: string;
  MODEL: string;
  DESCR: string;
  DEVICE_TYPE: string;
  interface: string;
  subtype: string;
  SWVER: string;
  PORT: string;
  DATATIME: string;
  ct_scl_fctr: string;
  net_ltea_3phsum_kwh: string;
  p_3phsum_kw: string;
  q_3phsum_kvar: string;
  s_3phsum_kva: string;
  tot_pf_rto: string;
  freq_hz: string;
  i1_a: string;
  i2_a: string;
  v1n_v: string;
  v2n_v: string;
  v12_v: string;
  p1_kw: string;
  p2_kw: string;
  neg_ltea_3phsum_kwh: string;
  pos_ltea_3phsum_kwh: string;
  CAL0: string;
  origin: string;
  OPERATION: string;
  CURTIME: string;
};

type PSVSupervisor = {
  DETAIL: string;
  STATE: string;
  STATEDESCR: string;
  SERIAL: string;
  MODEL: string;
  HWVER: string;
  SWVER: string;
  DEVICE_TYPE: string;
  DATATIME: string;
  dl_err_count: string;
  dl_comm_err: string;
  dl_skipped_scans: string;
  dl_scan_time: string;
  dl_untransmitted: string;
  dl_uptime: string;
  dl_cpu_load: string;
  dl_mem_used: string;
  dl_flash_avail: string;
  panid: number;
  CURTIME: string;
};

type PSVDevices = PSVInverter | PSVPowerMeter | PSVSupervisor;
interface APIResponse {
  devices: PSVDevices[];
}

type PanelQueryResponseAlert = {
  alertStatus: string;
  deviceSerialNumber: string;
  deviceType: string;
  deviceKey: string;
  alertId: string;
  alertType: string;
  eventTimestamp: string;
  __typename: string;
};

interface PanelQueryResponse {
  errors: {
    message: string;
    extensions: {
      code: string;
    };
  }[];
  data: {
    panels: {
      hasPanelLayout: boolean;
      siteDailyEnergyProduction: {
        timestamp: string;
        value: number;
        __typename: string;
      };
      siteHourlyPowerProduction: {
        timestamp: string;
        value: number | null;
        __typename: string;
      }[];
      panels: {
        serialNumber: string;
        dailyEnergyProduction: number;
        sevenDayAverage: number;
        lastCommunicationTimestamp: string;
        peakPowerProduction: {
          timestamp: string;
          value: number;
          __typename: string;
        };
        energyColorCode: number;
        alerts: PanelQueryResponseAlert[] | null;
        hourlyData: {
          timestamp: string;
          power: number;
          energy: number;
          powerColorCode: number;
          __typename: string;
        }[];
        layout: {
          xCoordinate: number;
          yCoordinate: number;
          rotation: number;
          azimuth: number;
          orientation: null;
          __typename: string;
        };
        __typename: string;
      }[];
      weather: any; // could type based on query. Maybe during the day it'll have data
      __typename: string;
    };
  };
}

interface DataSeriesResponse {
  errors: {
    message: string;
    extensions: {
      code: string;
    };
  }[];
  data: {
    power: {
      powerDataSeries: {
        production: [string, string, string][];
      };
    };
    energyRange: {
      energyDataSeries: {
        production: [string, string, string][];
      };
    };
  };
}

export {
  APIResponse,
  DataSeriesResponse,
  PanelQueryResponse,
  PanelQueryResponseAlert,
  PSVDevices,
  PSVInverter,
  PSVPowerMeter,
};
