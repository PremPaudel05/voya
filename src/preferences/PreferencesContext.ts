import { createContext, useContext } from 'react';
import type { InterfacePreferences } from '../../shared/preferences';
export type Notice = { type: 'guide' | 'plan'; country: string };
export interface PreferenceState {
  preferences: InterfacePreferences;
  update: (value: Partial<InterfacePreferences>) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  notify: (notice: Notice) => void;
}
export const PreferencesContext = createContext<PreferenceState | null>(null);
export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('PreferencesProvider is missing');
  return value;
}
