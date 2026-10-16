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
