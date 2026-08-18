export const DEFAULT_DISEASE_NAMES = [
  'East Coast fever',
  'Brucellosis',
  'Anthrax',
  'Anaplasmosis',
  'Worm infestation',
  'Foot and mouth disease',
  'Lumpy skin disease',
  'Mastitis',
] as const;

const DISEASE_I18N_KEY: Record<string, string> = {
  'East Coast fever': 'diseases.eastCoastFever',
  Brucellosis: 'diseases.brucellosis',
  Anthrax: 'diseases.anthrax',
  Anaplasmosis: 'diseases.anaplasmosis',
  'Worm infestation': 'diseases.wormInfestation',
  'Foot and mouth disease': 'diseases.footAndMouth',
  'Lumpy skin disease': 'diseases.lumpySkin',
  Mastitis: 'diseases.mastitis',
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function diseaseLabel(name: string, t: TranslateFn): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return name;
  }
  const key = DISEASE_I18N_KEY[trimmed];
  if (!key) {
    return trimmed;
  }
  const translated = t(key);
  return translated === key ? trimmed : translated;
}

export function diseaseOptionsFromNames(
  names: string[],
  t: TranslateFn,
  extraValue?: string,
): Array<{ label: string; value: string }> {
  const values = [
    ...new Set(
      [...names, extraValue ?? '']
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
  const list = values.length > 0 ? values : [...DEFAULT_DISEASE_NAMES];
  return list.map((value) => ({
    label: diseaseLabel(value, t),
    value,
  }));
}
