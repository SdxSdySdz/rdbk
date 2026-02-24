export const prefs = {
  getFloat: (key: string, def = 0): number => {
    const val = localStorage.getItem(key);
    if (val === null) return def;
    const num = parseFloat(val);
    return isNaN(num) ? def : num;
  },
  setFloat: (key: string, v: number) => localStorage.setItem(key, String(v)),

  getInt: (key: string, def = 0): number => {
    const val = localStorage.getItem(key);
    if (val === null) return def;
    const num = parseInt(val, 10);
    return isNaN(num) ? def : num;
  },
  setInt: (key: string, v: number) => localStorage.setItem(key, String(Math.round(v))),

  getString: (key: string, def = ''): string => localStorage.getItem(key) ?? def,
  setString: (key: string, v: string) => localStorage.setItem(key, v),

  getBool: (key: string, def = false): boolean => {
    const val = localStorage.getItem(key);
    if (val === null) return def;
    return val === '1';
  },
  setBool: (key: string, v: boolean) => localStorage.setItem(key, v ? '1' : '0'),

  save: () => {},
};
