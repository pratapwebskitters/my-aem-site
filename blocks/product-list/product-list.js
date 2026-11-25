function createCard(product) {
  const card = document.createElement('li');
  const title = document.createElement('h3');
  title.textContent = product.title;
  card.append(title);

  const fields = [
    ['product-list-category', product.category],
    ['product-list-description', product.description],
    ['product-list-price', product.price ? `Price: ${product.price}` : ''],
  ];
  fields.forEach(([className, value]) => {
    if (!value) return;
    const field = document.createElement('p');
    field.className = className;
    field.textContent = value;
    card.append(field);
  });
  return card;
}

export default async function decorate(block) {
  const status = document.createElement('p');
  status.className = 'product-list-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading products…';
  block.replaceChildren(status);

  let products;
  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error(`Products request failed (${response.status})`);
    const { data } = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid products data');
    products = data.map((row) => ({
      title: String(row?.title ?? '').trim(),
      category: String(row?.category ?? '').trim(),
      description: String(row?.description ?? '').trim(),
      price: String(row?.price ?? '').trim(),
    })).filter(({ title }) => title);
  } catch {
    status.textContent = 'Products are currently unavailable.';
    return;
  }

  if (!products.length) {
    status.textContent = 'No products available.';
    return;
  }

  const filter = document.createElement('label');
  filter.className = 'product-list-filter';
  const select = document.createElement('select');
  select.add(new Option('All categories', ''));
  const categories = new Map();
  products.forEach(({ category }) => {
    const key = category.toLowerCase();
    if (key && !categories.has(key)) categories.set(key, category);
  });
  [...categories.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([key, label]) => {
    select.add(new Option(label, key));
  });
  filter.append('Category', select);

  const grid = document.createElement('ul');
  grid.className = 'product-list-grid';
  const cards = products.map((product) => {
    const card = createCard(product);
    grid.append(card);
    return { card, category: product.category.toLowerCase() };
  });

  function applyFilter() {
    let count = 0;
    cards.forEach(({ card, category }) => {
      card.hidden = Boolean(select.value && category !== select.value);
      if (!card.hidden) count += 1;
    });
    status.textContent = `${count} ${count === 1 ? 'product' : 'products'}`;
  }

  select.addEventListener('change', applyFilter);
  if (categories.size) status.before(filter);
  block.append(grid);
  applyFilter();
}
