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
