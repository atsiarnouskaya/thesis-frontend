export type AppLocale = 'pl' | 'ru';

export type TranslationValues = Record<string, string | number>;

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};
