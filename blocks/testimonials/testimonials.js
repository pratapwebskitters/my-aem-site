export default function decorate(block) {
  const list = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [quote, attribution] = cells;

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
    list.append(card);
  });

  block.replaceChildren(list);
}
