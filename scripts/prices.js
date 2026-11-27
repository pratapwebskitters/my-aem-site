const formatters = {
  '/en': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  '/in': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
};

export default function formatPrice(price, locale) {
  const text = String(price ?? '').trim();
  const amount = Number(text);
  const formatter = formatters[locale];
  return text && formatter && Number.isFinite(amount) ? formatter.format(amount) : text;
}
