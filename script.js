// Analytics signals are kept locally for a future GTM implementation.
window.dataLayer = window.dataLayer || [];
const pushSignal = (event, parameters = {}) => window.dataLayer.push({ event, ...parameters });

// Analytics consent is explicit. No consent UI means page_view stays suppressed by default.
const analyticsConsent = localStorage.getItem('nova-analytics-consent') === 'granted';
if (analyticsConsent) pushSignal('page_view', { page_location: window.location.href });

// CTA clicks are observed only after an actual user click.
document.querySelectorAll('[data-cta-location]').forEach((cta) => {
  cta.addEventListener('click', () => pushSignal('cta_click', { cta_location: cta.dataset.ctaLocation }));
});

// Offer visibility is sent at most once per page view.
const offer = document.getElementById('oferta');
if ('IntersectionObserver' in window && offer) {
  const offerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
        pushSignal('section_view', { section_id: 'oferta' });
        offerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: [0.25] });
  offerObserver.observe(offer);
}

// Service interests carry the selected service name, never form field values.
document.querySelectorAll('[data-service]').forEach((card) => {
  card.addEventListener('click', () => {
    pushSignal('service_interest', { service_name: card.dataset.service });
    const interest = document.getElementById('interest');
    const matchingOption = [...interest.options].find((option) => option.value === card.dataset.service || option.textContent === card.dataset.service);
    if (matchingOption) interest.value = matchingOption.value;
    document.getElementById('kontakt').scrollIntoView({ behavior: 'smooth' });
  });
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Otwórz menu' : 'Zamknij menu');
  nav.classList.toggle('is-open', !expanded);
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Otwórz menu');
}));

const form = document.getElementById('lead-form');
const formStatus = document.getElementById('form-status');
let formStarted = false;
let leadSucceeded = false;
const fields = [
  { input: document.getElementById('email'), error: document.getElementById('email-error'), message: 'Podaj poprawny adres e-mail.' },
  { input: document.getElementById('interest'), error: document.getElementById('interest-error'), message: 'Wybierz temat zainteresowania.' },
  { input: document.getElementById('message'), error: document.getElementById('message-error'), message: 'Wiadomość musi zawierać co najmniej 10 znaków.' }
];
form.addEventListener('input', (event) => {
  if (event.target.matches('input, select, textarea') && !formStarted) {
    formStarted = true;
    pushSignal('form_start', { form_id: 'lead-form' });
  }
});
form.addEventListener('change', (event) => {
  if (event.target.matches('input, select, textarea') && !formStarted) {
    formStarted = true;
    pushSignal('form_start', { form_id: 'lead-form' });
  }
});
form.addEventListener('submit', (event) => {
  event.preventDefault(); // This demo never sends a request or puts field values in a URL.
  if (leadSucceeded) return;

  let valid = true;
  fields.forEach(({ input, error, message }) => {
    const fieldValid = input.checkValidity();
    input.setAttribute('aria-invalid', String(!fieldValid));
    error.textContent = fieldValid ? '' : message;
    if (!fieldValid) valid = false;
  });
  if (!valid) {
    formStatus.textContent = 'Sprawdź zaznaczone pola i spróbuj ponownie.';
    formStatus.classList.add('error');
    const firstInvalid = fields.find(({ input }) => !input.checkValidity());
    firstInvalid?.input.focus();
    return;
  }

  formStatus.classList.remove('error');
  formStatus.textContent = 'Demonstracja zakończona — dane nie zostały wysłane';
  form.querySelector('[type="submit"]').disabled = true;
  leadSucceeded = true;
  // Simulated success signal is emitted only after valid fields and visible confirmation.
  pushSignal('lead_success', { form_id: 'lead-form' });
});
fields.forEach(({ input, error }) => input.addEventListener('input', () => {
  if (input.checkValidity()) {
    input.setAttribute('aria-invalid', 'false');
    error.textContent = '';
    if (formStatus.classList.contains('error')) formStatus.textContent = '';
  }
}));
