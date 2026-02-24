import { useSettingsStore } from '../stores/settingsStore';
import enRaw from '../localization/translations_en.json';
import ruRaw from '../localization/translations_ru.json';

type TranslationFile = { Items: { Key: string; Value: string }[] };

function flatten(data: TranslationFile): Record<string, string> {
  const result: Record<string, string> = {};
  data.Items.forEach(({ Key, Value }) => {
    if (!result[Key]) result[Key] = Value; // first occurrence wins (handles duplicates)
  });
  return result;
}

const enMap = flatten(enRaw as TranslationFile);
const ruMap = flatten(ruRaw as TranslationFile);

export function useLocalization() {
  const language = useSettingsStore(s => s.language);
  const map = language === 'ru' ? ruMap : enMap;

  return function t(key: string, ...args: string[]): string {
    let text = map[key] ?? key;
    // Replace sprite tags like <sprite name="coin">
    text = text.replace(/<[^>]+>/g, '');
    // Replace {0}, {1} etc.
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, arg);
    });
    return text.trim();
  };
}

export function t(key: string, lang: 'en' | 'ru' = 'en'): string {
  const map = lang === 'ru' ? ruMap : enMap;
  return map[key] ?? key;
}
