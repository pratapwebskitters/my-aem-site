const requests = new Map();

export default function fetchPlaceholders(locale = '') {
  if (!requests.has(locale)) {
    const request = (async () => {
      try {
        const response = await fetch(`${locale}/placeholders.json`);
        if (!response.ok) throw new Error('Placeholders unavailable');
        const { data } = await response.json();
        return Object.fromEntries(data.filter(({ Key, Text }) => Key && Text)
          .map(({ Key, Text }) => [Key, Text]));
      } catch {
        requests.delete(locale);
        return {};
      }
    })();
    requests.set(locale, request);
  }
  return requests.get(locale);
}
