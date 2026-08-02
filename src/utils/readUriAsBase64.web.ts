export async function readUriAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Nie udało się odczytać podglądu zdjęcia');
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Nie udało się zakodować podglądu zdjęcia'));
        return;
      }

      const commaIndex = reader.result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Nie udało się zakodować podglądu zdjęcia'));
        return;
      }

      resolve(reader.result.slice(commaIndex + 1));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Nie udało się odczytać podglądu zdjęcia'));
    };
    reader.readAsDataURL(blob);
  });
}
