import { getLocalePrefix } from '../../scripts/scripts.js';
import fetchPlaceholders from '../../scripts/placeholders.js';
import { changeCart, readCart } from '../../scripts/cart.js';

export default async function decorate(block) {
  const locale = getLocalePrefix();
  const placeholders = await fetchPlaceholders(locale);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'button secondary';
  toggle.setAttribute('aria-haspopup', 'dialog');

  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', 'Shopping cart');
  const header = document.createElement('div');
  header.className = 'cart-drawer-heading';
  const title = document.createElement('h2');
  title.textContent = 'Shopping cart';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);

  const list = document.createElement('ul');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const checkout = document.createElement('button');
  checkout.type = 'button';
  checkout.className = 'button primary';
  checkout.textContent = placeholders.checkout
    || (locale === '/in' ? 'Checkout Now (INR)' : 'Proceed to Checkout');
  checkout.addEventListener('click', () => {
    status.textContent = 'Checkout is unavailable in this storefront demo.';
  });
  dialog.append(header, list, status, checkout);
  toggle.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => toggle.focus());

  function render() {
    const items = readCart(locale);
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const active = document.activeElement;
    const restoreFocus = list.contains(active);
    list.replaceChildren(...items.map((item, index) => {
      const row = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = `${item.title} × ${item.quantity}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.dataset.index = index;
      remove.setAttribute('aria-label', `Remove one ${item.title}`);
      remove.addEventListener('click', () => changeCart(locale, item, -1));
      row.append(text, remove);
      return row;
    }));
    toggle.textContent = `Cart (${count})`;
    status.textContent = count ? '' : 'Your cart is empty.';
    checkout.disabled = !count;
    if (restoreFocus) (list.querySelector(`[data-index="${active.dataset.index}"]`) || close).focus();
  }

  document.addEventListener('storefront-cart-change', ({ detail }) => {
    if (detail === locale) render();
  });
  block.replaceChildren(toggle, dialog);
  render();
}
