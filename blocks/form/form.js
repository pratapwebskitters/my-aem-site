const inputTypes = new Set(['text', 'email', 'tel', 'url', 'number', 'date', 'time', 'password', 'search', 'checkbox', 'hidden']);
let formCount = 0;

function getURL(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function createField({
  name, label, type, placeholder, required,
}, id, form) {
  const tag = ['select', 'textarea'].includes(type) ? type : 'input';
  const control = document.createElement(tag);
  control.name = name;
  if (tag === 'input') control.type = inputTypes.has(type) ? type : 'text';

  if (control.type === 'hidden') {
    control.value = placeholder;
    form.append(control);
    return null;
  }

  control.id = id;
  control.required = required;
  if (tag === 'select') {
    control.add(new Option('Select an option', ''));
    placeholder.split(',').map((option) => option.trim()).filter(Boolean).forEach((option) => {
      control.add(new Option(option, option));
    });
  } else if (control.type !== 'checkbox') {
    control.placeholder = placeholder;
  }

  const field = document.createElement('div');
  field.className = 'form-field';
  const caption = document.createElement('label');
  caption.htmlFor = id;
  caption.textContent = required ? `${label} (required)` : label;
  const error = document.createElement('p');
  error.id = `${id}-error`;
  error.className = 'form-error';
  error.hidden = true;

  if (control.type === 'checkbox') {
    field.classList.add('form-checkbox');
    field.append(control, caption);
  } else {
    field.append(caption, control);
  }
  field.append(error);
  form.append(field);

  function validate() {
    const empty = required && (control.validity.valueMissing || !control.value.trim());
    const message = empty ? `Enter or select a value for ${label}.` : control.validationMessage;
    error.textContent = message;
    error.hidden = !message;
    if (message) {
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', error.id);
    } else {
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    }
    return !message;
  }

  control.addEventListener('input', () => {
    if (!error.hidden) validate();
  });
  return { control, validate };
}

async function submitForm(endpoint, data) {
  if (!endpoint) return false;

  const { hostname, pathname } = endpoint;
  if (['web3forms.com', 'www.web3forms.com'].includes(hostname)) return false;
  if (hostname === 'api.web3forms.com' && /^\/submit\/?$/.test(pathname) && !data.access_key) return false;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json();
      return result?.success !== false;
    }
    return true;
  } catch {
    return false;
  }
}

export default async function decorate(block) {
  const row = block.firstElementChild;
  const source = getURL(row?.querySelector('a[href]')?.href || row?.textContent.trim());
  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading form…';
  block.replaceChildren(status);

  let rows;
  try {
    if (!source) throw new Error('Missing form sheet URL');
    const response = await fetch(source, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Form sheet request failed');
    const { data } = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid form sheet');
    rows = data.map((item) => ({
      name: String(item?.Field ?? '').trim(),
      label: String(item?.Label ?? '').trim(),
      type: String(item?.Type ?? '').trim().toLowerCase(),
      placeholder: String(item?.Placeholder ?? '').trim(),
      required: /^(true|yes|1|required)$/i.test(String(item?.Required ?? '').trim()),
    }));
  } catch {
    status.textContent = 'The form is currently unavailable.';
    return;
  }

  const form = document.createElement('form');
  form.noValidate = true;
  form.method = 'post';
  formCount += 1;
  const isSubmit = ({ name, type }) => type === 'submit' || name.toLowerCase() === 'submit';
  const fields = rows.filter((item) => item.name && !isSubmit(item)).map((item, index) => (
    createField({ ...item, label: item.label || item.name }, `form-${formCount}-${index}`, form)
  )).filter(Boolean);
  if (!fields.length) {
    status.textContent = 'The form has no fields to display.';
    return;
  }

  const submit = rows.find(isSubmit);
  const endpoint = getURL(submit?.placeholder);
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary form-submit';
  const buttonLabel = submit?.label || 'Submit';
  button.textContent = buttonLabel;
  form.append(button);
  block.prepend(form);
  status.textContent = '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;

    status.className = 'form-status';
    status.textContent = '';
    const invalid = fields.filter(({ validate }) => !validate());
    if (invalid.length) {
      if (document.activeElement === invalid[0].control) status.textContent = 'Check the highlighted fields and try again.';
      invalid[0].control.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    button.disabled = true;
    button.textContent = 'Submitting…';
    status.textContent = 'Submitting form…';
    const sent = await submitForm(endpoint, data);
    button.disabled = false;
    button.textContent = buttonLabel;
    if (sent) HTMLFormElement.prototype.reset.call(form);

    status.classList.add(sent ? 'form-success' : 'form-preview');
    status.textContent = sent
      ? 'Thank you! Your form was submitted successfully.'
      : 'Submission preview complete. Delivery was not confirmed.';
  });
}
