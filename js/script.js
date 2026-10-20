// Ny sidöppning utan sektionslänk och omladdning börjar högst upp.
// Direktlänkar till sektioner och webbläsarens bakåtknapp behåller sitt beteende.
const navigering = performance.getEntriesByType('navigation')[0];
const borjaHogstUpp = navigering?.type === 'reload' ||
  (navigering?.type !== 'back_forward' && !window.location.hash);
if (borjaHogstUpp) {
  const tidigareScrollaterstallning = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  if (navigering?.type === 'reload' && window.location.hash) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  }
  window.addEventListener('pageshow', () => {
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});
    history.scrollRestoration = tidigareScrollaterstallning;
  }, {once: true});
}

// Kompakt mobilmeny. Utan JavaScript ligger länkarna synliga.
const menyknapp = document.querySelector('.menyknapp');
const huvudmeny = document.querySelector('#huvudmeny');
const sidhuvud = document.querySelector('.sidhuvud');
if (menyknapp && huvudmeny && sidhuvud) {
  const mobilvy = matchMedia('(max-width: 767px)');
  function stangMeny(flyttaFokus = false) {
    menyknapp.setAttribute('aria-expanded', 'false');
    sidhuvud.classList.remove('meny-oppen');
    if (flyttaFokus) menyknapp.focus();
  }
  menyknapp.hidden = false;
  sidhuvud.classList.add('har-mobilmeny');
  menyknapp.addEventListener('click', () => {
    const oppen = menyknapp.getAttribute('aria-expanded') !== 'true';
    menyknapp.setAttribute('aria-expanded', String(oppen));
    sidhuvud.classList.toggle('meny-oppen', oppen);
  });
  huvudmeny.addEventListener('click', event => {
    if (mobilvy.matches && event.target.closest('a')) stangMeny(true);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidhuvud.classList.contains('meny-oppen')) stangMeny(true);
  });
  document.addEventListener('click', event => {
    if (!sidhuvud.contains(event.target)) stangMeny();
  });
  mobilvy.addEventListener('change', () => stangMeny());
}

// Håll sidfotens årtal aktuellt.
const ar = document.querySelector('#ar');
if (ar) ar.textContent = new Date().getFullYear();
// Innehållet är alltid synligt, också när JavaScript saknas.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('synlig');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('main > section:not(.intro)').forEach(section => observer.observe(section));
}

// Rullande kurslista: endast originalet läses upp av skärmläsare.
const kursbanner = document.querySelector('.kursbanner');
if (kursbanner) {
  const lista = kursbanner.querySelector('.kurslista');
  const spar = kursbanner.querySelector('.kurser-spar');
  const minskadRorelse = matchMedia('(prefers-reduced-motion: reduce)');
  const kopia = lista.cloneNode(true);
  kopia.classList.add('kurskopia');
  kopia.setAttribute('aria-hidden', 'true');
  spar.append(kopia);
  function uppdateraRullning() {
    kursbanner.classList.toggle('rullar', !minskadRorelse.matches);
    kopia.hidden = minskadRorelse.matches;
  }
  minskadRorelse.addEventListener('change', uppdateraRullning);
  uppdateraRullning();
}

// Mörkt är standard. Besökarens manuella val sparas när lagring är tillgänglig.
const temaknapp = document.querySelector('.temaknapp');
if (temaknapp) {
  function visaTemaval() {
    const ljust = document.documentElement.dataset.theme === 'light';
    const etikett = ljust ? 'Byt till mörkt läge' : 'Byt till ljust läge';
    temaknapp.setAttribute('aria-label', etikett);
    temaknapp.title = etikett;
  }
  temaknapp.hidden = false;
  visaTemaval();
  temaknapp.addEventListener('click', () => {
    const tema = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = tema;
    try { localStorage.setItem('tim-tema', tema); } catch (_) { /* Växlingen fungerar utan lagring. */ }
    visaTemaval();
  });
}

// Eget formulär via HubSpots publika Forms API. Inga API-nycklar eller spårningscookies.
const kontaktformular = document.querySelector('#kontaktformular');
if (kontaktformular) {
  const faltgrupp = kontaktformular.querySelector('fieldset');
  const status = document.querySelector('#formular-status');
  const skicka = kontaktformular.querySelector('[type="submit"]');
  let skickar = false;
  kontaktformular.addEventListener('submit', async event => {
    event.preventDefault();
    if (skickar) return;
    const meddelandefalt = kontaktformular.querySelector('[name="message"]');
    meddelandefalt.setCustomValidity(meddelandefalt.value.trim() ? '' : 'Skriv ett meddelande.');
    if (!kontaktformular.reportValidity()) return;
    const data = new FormData(kontaktformular);
    const fields = ['firstname', 'email', 'company', 'message'].map(name => ({
      objectTypeId: '0-1', name, value: String(data.get(name) || '').trim()
    })).filter(field => field.value);
    const payload = {fields};
    // Skicka inte lokala filsökvägar eller URL-parametrar till HubSpot.
    if (location.protocol === 'https:' || location.protocol === 'http:') {
      payload.context = {pageUri: location.origin + location.pathname, pageName: document.title};
    }
    skickar = true;
    faltgrupp.disabled = true;
    kontaktformular.setAttribute('aria-busy', 'true');
    skicka.textContent = 'Skickar…';
    status.dataset.state = 'pending';
    status.textContent = 'Ditt meddelande skickas…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://api.hsforms.com/submissions/v3/integration/submit/149565909/9ad85a76-5ac2-4927-8fd1-e094a9e6d5cc', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        credentials: 'omit', body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) {
        const svar = await response.json().catch(() => ({}));
        const skydd = (svar.errors || []).some(error => /CAPTCHA|CONSENT/.test(error.errorType || ''));
        throw new Error(skydd ? 'protection' : response.status === 429 ? 'rate' : 'rejected');
      }
      status.dataset.state = 'success';
      status.textContent = 'Tack! HubSpot har tagit emot ditt meddelande.';
      kontaktformular.reset();
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message === 'protection'
        ? 'HubSpot kräver ytterligare verifiering. Använd mejllänken nedan. Din text finns kvar.'
        : error.message === 'rate'
          ? 'För många försök just nu. Vänta en stund och försök igen. Din text finns kvar.'
          : 'Vi kunde inte bekräfta att meddelandet kom fram. Din text finns kvar. Försök igen senare eller använd mejllänken nedan.';
    } finally {
      clearTimeout(timeout);
      skickar = false;
      faltgrupp.disabled = false;
      kontaktformular.removeAttribute('aria-busy');
      skicka.textContent = 'Skicka';
    }
  });
  kontaktformular.querySelector('[name="message"]').addEventListener('input', event => {
    event.target.setCustomValidity('');
  });
  faltgrupp.disabled = false;
}
