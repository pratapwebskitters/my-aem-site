export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim()) return;
    const item = document.createElement('li');
    item.append(...row.children);
    list.append(item);
  });
  block.replaceChildren(list);
}
