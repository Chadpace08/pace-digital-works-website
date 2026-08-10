/* Shared behaviour for every Pace Digital Works sample website. */

/* Mobile menu */
const b = document.querySelector('[data-burger]');
const m = document.querySelector('[data-menu]');
if (b && m) {
  b.addEventListener('click', () => {
    const open = m.classList.toggle('is-open');
    b.setAttribute('aria-expanded', String(open));
  });
  m.addEventListener('click', (e) => {
    if (e.target.closest('a')) { m.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }
  });
}

/* Scroll reveal */
const rv = document.querySelectorAll('.d-rv');
if (rv.length) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const peers = e.target.parentElement
          ? [...e.target.parentElement.children].filter((c) => c.classList.contains('d-rv')) : [];
        e.target.style.setProperty('--d', `${Math.min(Math.max(peers.indexOf(e.target), 0), 7) * 65}ms`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rv.forEach((el) => io.observe(el));
  }
}

/* Forms: this is a sample site, so show a friendly confirmation instead of sending */
document.querySelectorAll('form[data-demo-form]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const note = form.querySelector('.d-sent');
    if (note) {
      note.classList.add('is-on');
      note.setAttribute('role', 'status');
      note.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    form.querySelectorAll('input, textarea, select').forEach((f) => { if (f.type !== 'submit') f.value = ''; });
  });
});

/* Year */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
