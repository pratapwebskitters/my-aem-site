const carts = new Map();

export function readCart(locale) {
  if (!carts.has(locale)) {
    let items = [];
    try {
      const saved = JSON.parse(localStorage.getItem(`storefront-cart${locale}`));
      if (Array.isArray(saved)) {
        items = saved.filter((item) => (
          item && typeof item.title === 'string' && Number.isSafeInteger(item.quantity)
        && item.quantity > 0
        ));
      }
    } catch {
      // A cart can still be used when storage is unavailable.
    }
    carts.set(locale, items);
  }
  return carts.get(locale);
}

export function changeCart(locale, product, delta) {
  const items = readCart(locale);
  const previous = items.find(({ title, category }) => (
    title === product.title && category === product.category
  ));
  const quantity = (previous?.quantity || 0) + delta;
  if (previous && quantity > 0) previous.quantity = quantity;
  else if (previous) items.splice(items.indexOf(previous), 1);
  else if (quantity > 0) items.push({ ...product, quantity });
  try {
    localStorage.setItem(`storefront-cart${locale}`, JSON.stringify(items));
  } catch {
    // Keep the in-memory cart when storage cannot be written.
  }
  document.dispatchEvent(new CustomEvent('storefront-cart-change', { detail: locale }));
}
