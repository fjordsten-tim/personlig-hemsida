// Årtal och en utfällning som fungerar med tangentbord och skärmläsare.
const ar = document.querySelector('#ar');
if (ar) ar.textContent = new Date().getFullYear();
const knapp = document.querySelector('.las-mer');
const mer = document.querySelector('#mer-om-mig');
if (knapp && mer) {
  mer.hidden = true;
  knapp.hidden = false;
  knapp.setAttribute('aria-expanded', 'false');
  knapp.addEventListener('click', () => {
    mer.hidden = !mer.hidden;
    knapp.setAttribute('aria-expanded', String(!mer.hidden));
    knapp.textContent = mer.hidden ? 'Läs mer' : 'Visa mindre';
  });
}
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
