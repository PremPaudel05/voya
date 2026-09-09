export const THEMES = ['light', 'dark', 'system'] as const;
export const CONTRASTS = ['standard', 'high'] as const;
export const LANGUAGES = ['en', 'es', 'fr'] as const;
export type InterfacePreferences = {
  appearanceVersion: 1;
  theme: typeof THEMES[number];
  contrast: typeof CONTRASTS[number];
  language: typeof LANGUAGES[number];
  reducedMotion: boolean;
  notifications: { inApp: boolean; browser: boolean };
};
export const DEFAULT_INTERFACE: InterfacePreferences = {
  appearanceVersion: 1,
  theme: 'light', contrast: 'standard', language: 'en', reducedMotion: false,
  notifications: { inApp: true, browser: false },
};
// Stored accounts created before settings were introduced receive safe defaults.
export function interfaceDefaults(value?: Partial<InterfacePreferences> | null): InterfacePreferences {
  return {
    // Old clients saved "system" automatically. Only follow the device after
    // a choice made with the new light default; retain explicit light/dark saves.
    appearanceVersion: 1,
    theme: value?.theme === 'dark' ? 'dark'
      : value?.theme === 'system' && value.appearanceVersion === 1 ? 'system' : 'light',
    contrast: CONTRASTS.includes(value?.contrast as InterfacePreferences['contrast']) ? value!.contrast! : 'standard',
    language: LANGUAGES.includes(value?.language as InterfacePreferences['language']) ? value!.language! : 'en',
    reducedMotion: value?.reducedMotion === true,
    notifications: { inApp: value?.notifications?.inApp !== false, browser: value?.notifications?.browser === true },
  };
}
