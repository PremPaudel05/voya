import { createContext, useContext } from 'react';
import type { Account, AccountConfig, Preferences } from '../services/accountService';
export interface AccountState {
  account: Account | null;
  config: AccountConfig | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  login: (credential: string, turnstileToken: string) => Promise<void>;
  logout: () => Promise<void>;
  saveSettings: (settings: Preferences) => Promise<void>;
  deleteAccount: (email: string, confirmation: string) => Promise<void>;
  recordSearch: (countryName: string) => Promise<void>;
}
export const AccountContext = createContext<AccountState | null>(null);
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error('AccountProvider is missing');
  return value;
}
