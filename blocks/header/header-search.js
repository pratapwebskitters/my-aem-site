function pageFromPath(path, title, description) {
  try {
    const url = new URL(path, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const { pathname } = url;
    if (pathname.startsWith('//')) return null;
    const name = decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) || 'Home')
      .replace(/[-_]+/g, ' ');
    return { path: pathname, title: title || name, description };
  } catch {
    return null;
  }
}

async function loadPages() {
  const response = await fetch('/query-index.json');
  if (response.ok) {
    const { data } = await response.json();
    if (Array.isArray(data) && data.length) {
      return data.filter((page) => page?.path).map(({ path, title, description }) => (
        pageFromPath(path, title, description)
      )).filter(Boolean);
    }
  }

  const sitemap = await fetch('/sitemap.xml');
  if (!sitemap.ok) throw new Error('Search sitemap unavailable');
  const xml = new DOMParser().parseFromString(await sitemap.text(), 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid search sitemap');
  return [...xml.querySelectorAll('url > loc')].map((location) => (
    pageFromPath(location.textContent.trim())
  )).filter(Boolean);
}

let pagesRequest;

export default function decorateSearch(tools) {
  const icon = tools?.querySelector('.icon-search');
  if (!icon || icon.closest('a, button')) return;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-search-toggle';
  trigger.setAttribute('aria-label', 'Search site');
  trigger.setAttribute('popovertarget', 'nav-search');
  icon.replaceWith(trigger);
  trigger.append(icon);
  icon.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('div');
  panel.id = 'nav-search';
  panel.className = 'nav-search';
  panel.setAttribute('popover', 'auto');
  panel.innerHTML = `
    <form role="search">
      <label for="nav-search-query">Search site</label>
      <div class="nav-search-fields">
        <input id="nav-search-query" name="q" type="search" required autofocus>
        <button type="submit" class="button primary">Search</button>
      </div>
    </form>
    <p class="nav-search-status" role="status"></p>
    <ul class="nav-search-results" aria-label="Search results"></ul>
  `;
  tools.append(panel);

  const form = panel.querySelector('form');
  const input = panel.querySelector('input');
  const status = panel.querySelector('[role="status"]');
  const results = panel.querySelector('ul');
  let latestSearch = 0;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    latestSearch += 1;
    const search = latestSearch;
    const query = input.value.trim().toLowerCase();
    results.replaceChildren();
    if (!query) {
      status.textContent = 'Enter a search term.';
      return;
    }

    status.textContent = 'Searching…';
    try {
      pagesRequest ||= loadPages().catch((error) => {
        pagesRequest = undefined;
        throw error;
      });
      const pages = await pagesRequest;
      if (search !== latestSearch) return;
      const terms = query.split(/\s+/);
      const matches = pages.filter(({ path, title, description }) => {
        const text = `${title} ${path} ${description || ''}`.toLowerCase();
        return terms.every((term) => text.includes(term));
      });
      matches.slice(0, 10).forEach(({ path, title }) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = path;
        link.textContent = title;
        item.append(link);
        results.append(item);
      });
      if (matches.length > 10) status.textContent = `Showing 10 of ${matches.length} results.`;
      else if (matches.length === 1) status.textContent = '1 result found.';
      else status.textContent = matches.length ? `${matches.length} results found.` : 'No results found.';
    } catch {
      if (search === latestSearch) status.textContent = 'Search is unavailable. Please try again.';
    }
  });
}
