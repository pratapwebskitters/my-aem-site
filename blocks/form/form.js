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
  if (tag === 'textarea') field.classList.add('form-field-message');
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

export default async function decorate(block) {
  const row = block.firstElementChild;
  const pace = block.classList.contains('pace');
  const intro = pace ? [...(row?.nextElementSibling?.querySelectorAll('h2, p') || [])] : [];
  const source = getURL(row?.querySelector('a[href]')?.href || row?.textContent.trim());
  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading form…';
  if (intro.length) {
    const copy = document.createElement('div');
    copy.className = 'form-pace-intro';
    copy.append(...intro);
    block.replaceChildren(copy, status);
  } else block.replaceChildren(status);

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
    createField({
      ...item,
      label: item.label || item.name,
      placeholder: pace && item.required && item.type !== 'hidden'
        ? `${item.placeholder || item.label || item.name}*`
        : item.placeholder,
    }, `form-${formCount}-${index}`, form)
  )).filter(Boolean);
  if (!fields.length) {
    status.textContent = 'The form has no fields to display.';
    return;
  }

  const submit = rows.find(isSubmit);
  const endpoint = getURL(submit?.placeholder || 'https://web3forms.com');
  // The Web3Forms homepage is the authoring default. POST to its API instead.
  const submitUrl = ['web3forms.com', 'www.web3forms.com'].includes(endpoint?.hostname) && endpoint.pathname === '/'
    ? 'https://api.web3forms.com/submit'
    : endpoint?.href;
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary form-submit';
  const buttonLabel = submit?.label || 'Submit';
  button.textContent = buttonLabel;
  form.append(button);
  status.before(form);
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

    if (pace && !submit?.placeholder) {
      status.classList.add('form-preview');
      status.textContent = 'Draft form validated. Add a submission endpoint to enable delivery.';
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
    button.disabled = true;
    button.textContent = 'Submitting…';
    status.textContent = 'Submitting form…';

    try {
      if (!submitUrl) throw new Error('The submission URL is invalid.');
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success) {
        HTMLFormElement.prototype.reset.call(form);
        status.classList.add('form-success');
        status.textContent = 'Thank you! Your message has been sent.';
      } else {
        status.classList.add('form-submit-error');
        status.textContent = result?.message || `Unable to send your message (HTTP ${response.status}).`;
      }
    } catch {
      status.classList.add('form-submit-error');
      status.textContent = submitUrl
        ? 'Unable to reach the submission service. Please try again.'
        : 'The submission URL is invalid.';
    } finally {
      button.disabled = false;
      button.textContent = buttonLabel;
    }
  });
}
