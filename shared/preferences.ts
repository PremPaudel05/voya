export const THEMES = ['system', 'light', 'dark'] as const;
export const CONTRASTS = ['standard', 'high'] as const;
export const LANGUAGES = ['en', 'es', 'fr'] as const;
export type InterfacePreferences = {
  theme: typeof THEMES[number];
  contrast: typeof CONTRASTS[number];
  language: typeof LANGUAGES[number];
  reducedMotion: boolean;
  notifications: { inApp: boolean; browser: boolean };
};
export const DEFAULT_INTERFACE: InterfacePreferences = {
  theme: 'system', contrast: 'standard', language: 'en', reducedMotion: false,
  notifications: { inApp: true, browser: false },
};
// Stored accounts created before settings were introduced receive safe defaults.
export function interfaceDefaults(value?: Partial<InterfacePreferences> | null): InterfacePreferences {
  return {
    theme: THEMES.includes(value?.theme as InterfacePreferences['theme']) ? value!.theme! : 'system',
    contrast: CONTRASTS.includes(value?.contrast as InterfacePreferences['contrast']) ? value!.contrast! : 'standard',
    language: LANGUAGES.includes(value?.language as InterfacePreferences['language']) ? value!.language! : 'en',
    reducedMotion: value?.reducedMotion === true,
    notifications: { inApp: value?.notifications?.inApp !== false, browser: value?.notifications?.browser === true },
  };
}
