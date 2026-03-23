import apiClient from './api';

// Margin data interfaces matching backend schemas
export interface MarginAvailable {
  cash: number;
  opening_balance: number;
  live_balance: number;
  collateral: number;
  adhoc_margin: number;
  intraday_payin: number;
}

export interface MarginUtilised {
  debits: number;
  exposure: number;
  m2m_realised: number;
  m2m_unrealised: number;
  option_premium: number;
  payout: number;
  span: number;
  holding_sales: number;
  turnover: number;
  liquid_collateral: number;
  stock_collateral: number;
  delivery: number;
}

export interface SegmentMargin {
  enabled: boolean;
  net: number;
  available: MarginAvailable;
  utilised: MarginUtilised;
}

export interface AccountMargin {
  account_id: number;
  broker_name: string;
  nickname?: string;
  trading_login_id: string;
  equity: SegmentMargin;
  commodity?: SegmentMargin;
  last_updated: string;
}

export interface MarginListResponse {
  margins: AccountMargin[];
  total_accounts: number;
}

const DUMMY_MARGINS: MarginListResponse = {
  margins: [
    {
      account_id: 1,
      broker_name: 'ZERODHA',
      nickname: 'Zerodha Main',
      trading_login_id: 'AB1234',
      equity: {
        enabled: true,
        net: 50000.00,
        available: {
          cash: 50000.00,
          opening_balance: 50000.00,
          live_balance: 48500.00,
          collateral: 0,
          adhoc_margin: 0,
          intraday_payin: 0
        },
        utilised: {
          debits: 1500.00,
          exposure: 500.00,
          m2m_realised: 0,
          m2m_unrealised: 0,
          option_premium: 0,
          payout: 0,
          span: 1000.00,
          holding_sales: 0,
          turnover: 0,
          liquid_collateral: 0,
          stock_collateral: 0,
          delivery: 0
        }
      },
      last_updated: new Date().toISOString()
    }
  ],
  total_accounts: 1
};

export const marginService = {
  /**
   * Get margin data for all user's enabled accounts
   */
  getAll: async (): Promise<MarginListResponse> => {
    try {
      const response = await apiClient.get('/accounts/margins');
      return response.data;
    } catch (error) {
      console.warn('API call failed, returning dummy margins', error);
      return DUMMY_MARGINS;
    }
  },
};
