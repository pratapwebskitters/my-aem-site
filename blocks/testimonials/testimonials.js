export default function decorate(block) {
  const list = document.createElement('ul');
  const authorFirst = block.classList.contains('author-first');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [quote, attribution] = authorFirst ? [cells[1], cells[0]] : cells;

    if (!row.textContent.trim() && !row.querySelector('img, video, audio, svg, iframe')) return;

    const card = document.createElement('li');
    if (quote?.textContent.trim()) {
      if (!quote.querySelector('blockquote')) {
        const quotation = document.createElement('blockquote');
        quotation.append(...quote.childNodes);
        quote.append(quotation);
      }
      quote.classList.add('testimonials-quote');
    }
    attribution?.classList.add('testimonials-attribution');
    card.append(...cells);
    if (authorFirst && quote) card.prepend(quote);
    list.append(card);
  });

  block.replaceChildren(list);
}
