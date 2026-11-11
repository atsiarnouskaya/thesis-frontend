import { TranslationTree, TranslationValues } from './types';

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value != null ? String(value) : '';
  });
}

export function resolveTranslation(
  tree: TranslationTree,
  key: string,
  values?: TranslationValues,
): string {
  const parts = key.split('.');
  let node: string | TranslationTree | undefined = tree;

  for (const part of parts) {
    if (node == null || typeof node === 'string') {
      return key;
    }
    node = node[part];
  }

  if (typeof node !== 'string') {
    return key;
  }

  return interpolate(node, values);
}

export function intlLocaleForApp(locale: 'pl' | 'ru'): string {
  return locale === 'ru' ? 'ru-RU' : 'pl-PL';
}
