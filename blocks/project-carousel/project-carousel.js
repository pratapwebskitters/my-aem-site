export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'project-carousel-track';
  track.setAttribute('aria-label', 'Featured projects');
  const showFeatured = block.closest('.pace-page') && window.matchMedia('(min-width: 1200px)').matches;
  [...block.children].forEach((row, index) => {
    const [photo, details] = row.children;
    if (!photo || !details) return;

    const card = document.createElement('li');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'project-carousel-toggle';
    const title = details.querySelector('h3')?.textContent.trim() || 'project';
    toggle.setAttribute('aria-label', `Toggle details for ${title}`);
    const expanded = Boolean(showFeatured && index === 1);
    toggle.setAttribute('aria-expanded', expanded);
    details.className = 'project-carousel-details';
    details.hidden = !expanded;
    toggle.addEventListener('click', () => {
      details.hidden = !details.hidden;
      toggle.setAttribute('aria-expanded', !details.hidden);
    });
    card.append(photo, details, toggle);
    track.append(card);
  });

  const controls = document.createElement('div');
  controls.className = 'project-carousel-controls';
  [-1, 1].forEach((direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', direction < 0 ? 'Previous projects' : 'Next projects');
    button.textContent = direction < 0 ? '‹' : '›';
    button.addEventListener('click', () => {
      const max = track.scrollWidth - track.clientWidth;
      const start = track.scrollLeft;
      let target = start + (direction * track.clientWidth);
      if (direction < 0 && start < 2) target = max;
      if (direction > 0 && start >= max - 2) target = 0;
      track.scrollTo({ left: target });
    });
    controls.append(button);
  });
  function updateControls() {
    controls.hidden = track.scrollWidth <= track.clientWidth + 1;
  }

  block.replaceChildren(track, controls);
  new ResizeObserver(updateControls).observe(track);
}
