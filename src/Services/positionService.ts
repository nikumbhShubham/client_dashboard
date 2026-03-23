import apiClient from './api';

// Position interface matching backend schema
export interface Position {
  id: string;
  symbol: string;
  m2m: number;
  pnl: number;
  atpnl: number;
  realpl: number;
  unrealpl: number;
  netqty: number;
  ltp: number;
  buyqty: number;
  sellqty: number;
  buyval: number;
  sellval: number;
  netval: number;
  bavg: number;
  savg: number;
  state: string;
  direction: string;
  type: string;
  category: string;
  broker: string;
  overqty: number;
  multiplier: number;
  exch: string;
  brexch: string;
  brsymbol: string;
  day: string;
  platform: string;
  accid: string;
  account_id: number;
  last_updated: string;
}

export interface PositionListResponse {
  positions: Position[];
  total_positions: number;
  active_positions: number;
}

const DUMMY_POSITIONS: PositionListResponse = {
  positions: [
    {
      id: '1',
      symbol: 'SBIN-EQ',
      m2m: 1500.50,
      pnl: 1200.00,
      atpnl: 1200.00,
      realpl: 0,
      unrealpl: 1200.00,
      netqty: 100,
      ltp: 605.50,
      buyqty: 100,
      sellqty: 0,
      buyval: 59350.00,
      sellval: 0,
      netval: -59350.00,
      bavg: 593.50,
      savg: 0,
      state: 'OPEN',
      direction: 'LONG',
      type: 'INTRADAY',
      category: 'EQUITY',
      broker: 'ZERODHA',
      overqty: 0,
      multiplier: 1,
      exch: 'NSE',
      brexch: 'NSE',
      brsymbol: 'SBIN',
      day: '2025-02-25',
      platform: 'web',
      accid: 'AB1234',
      account_id: 1,
      last_updated: new Date().toISOString()
    }
  ],
  total_positions: 1,
  active_positions: 1
};

export const positionService = {
  /**
   * Get consolidated positions for all user's enabled accounts
   * @param openOnly If true, return only positions with net quantity != 0
   */
  getAll: async (openOnly: boolean = true): Promise<PositionListResponse> => {
    try {
      const response = await apiClient.get('/positions', {
        params: { open_only: openOnly }
      });
      return response.data;
    } catch (error) {
      console.warn('API call failed, returning dummy positions', error);
      return DUMMY_POSITIONS;
    }
  },

  /**
   * Get real-time PnL from the local 5paisa fetcher script
   */
  getRealtimePnL: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/realtime/pnl');
      return response.data;
    } catch (error) {
      console.warn('Real-time fetcher not reached, using dummy 0', error);
      return { total_m2m: 0, total_pnl: 0, positions: [], status: 'Offline' };
    }
  }
};
