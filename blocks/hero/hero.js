export default function decorate(block) {
  if (!block.classList.contains('pace')) return;
  const heading = block.querySelector('h1');
  const photo = block.querySelector('picture, img');
  if (!heading || !photo) return;

  const headline = heading.textContent.trim();
  if (headline.endsWith('CE.')) {
    const accent = document.createElement('span');
    accent.textContent = 'CE.';
    heading.replaceChildren(headline.slice(0, -3), accent);
  }

  const list = block.querySelector('ul');
  list?.querySelectorAll('li').forEach((item) => {
    const [first, ...rest] = item.textContent.trim();
    if (!first) return;
    const accent = document.createElement('span');
    accent.textContent = first;
    item.replaceChildren(accent, rest.join(''));
  });

  const copy = document.createElement('div');
  copy.className = 'hero-pace-copy';
  copy.append(heading);
  if (list) copy.append(list);
  photo.classList.add('hero-pace-photo');
  block.replaceChildren(photo, copy);
}
