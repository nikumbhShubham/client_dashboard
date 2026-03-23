import apiClient from './api';

// Account types matching MongoDB schema
export interface AccountCreateData {
  NAME: string;
  APP_NAME: string;
  APP_SOURCE: string;
  USER_ID: string;
  PASSWORD: string;
  USER_KEY: string;
  ENCRYPTION_KEY: string;
  totp_secret: string;
  mpin: string;
  client_code: string;
}

export interface ValidationResponse {
  valid: boolean;
  message: string;
  broker: string;
}

export interface Account {
  account_id: string;
  owner_id: number;
  broker_name: string;
  nickname?: string;
  trading_login_id: string;
  is_enabled: boolean;
  is_validated: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountListResponse {
  accounts: Account[];
  total: number;
}

export const accountService = {
  // Validate credentials by attempting 5paisa login
  validate: async (data: AccountCreateData): Promise<ValidationResponse> => {
    const response = await apiClient.post('/accounts/validate', data);
    return response.data;
  },

  // Create account (saves to MongoDB + auto-login)
  create: async (data: AccountCreateData): Promise<Account> => {
    const response = await apiClient.post('/accounts', data);
    return response.data;
  },

  // Get all accounts from MongoDB
  getAll: async (enabledOnly?: boolean): Promise<AccountListResponse> => {
    const params = enabledOnly ? { enabled_only: true } : {};
    const response = await apiClient.get('/accounts', { params });
    return response.data;
  },

  // Delete account by client_code
  delete: async (clientCode: string): Promise<void> => {
    await apiClient.delete(`/accounts/${clientCode}`);
  },
};
