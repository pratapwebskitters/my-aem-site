export default function decorate(block) {
  const [center, ...rows] = block.children;
  const logo = center?.querySelector('picture, img');
  const hub = document.createElement('div');
  hub.className = 'market-wheel-hub';
  if (logo) hub.append(logo);

  const list = document.createElement('ul');
  rows.forEach((row) => {
    if (!row.textContent.trim()) return;
    const item = document.createElement('li');
    item.append(...row.children);
    list.append(item);
  });
  block.replaceChildren(hub, list);
}
