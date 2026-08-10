/* Pace Digital Works — small helpers. No libraries, no build step. */

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Filled in by the swipe-row counter further down (section 11). The industry
   filter in section 8 hides cards, which changes how many are swipeable, so
   it tells each counter here to recount itself. */
const railWatchers = [];

/* 1. Mobile menu ---------------------------------------------------------- */
const burger = document.querySelector('[data-burger]');
const nav = document.querySelector('[data-nav]');

if (burger && nav) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* 2. Hairline under the header once the page scrolls ---------------------- */
const hdr = document.querySelector('[data-hdr]');
if (hdr) {
  const onScroll = () => hdr.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* 3. Scroll reveal --------------------------------------------------------
   Three kinds, all driven by the same watcher:
   .rv        block rises and fades in
   .rv-img    picture uncovers from its bottom edge
   .rv-lines  headline lines slide up from behind a hidden edge          */
const reveals = document.querySelectorAll('.rv, .rv-img, .rv-lines');

if (reveals.length) {
  if (REDUCE || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
    document.querySelectorAll('[data-count]').forEach((el) => {
      el.textContent = el.dataset.count;
    });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        /* Items in the same row arrive one after another, not all together. */
        if (el.classList.contains('rv') && !el.style.getPropertyValue('--d')) {
          const peers = el.parentElement
            ? [...el.parentElement.children].filter((c) => c.classList.contains('rv'))
            : [];
          const i = Math.max(peers.indexOf(el), 0);
          el.style.setProperty('--d', `${Math.min(i, 8) * 75}ms`);
        }

        el.classList.add('is-in');
        countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    reveals.forEach((el) => io.observe(el));
  }
}

/* 4. Numbers that count up when they arrive ------------------------------- */
function countUp(scope) {
  const targets = scope.matches('[data-count]')
    ? [scope]
    : [...scope.querySelectorAll('[data-count]')];

  targets.forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';

    const end = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(end)) return;

    const ms = 1100;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);        /* fast, then settles */
      el.textContent = String(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* 5. Gentle drift on the hero pictures ------------------------------------ */
const parallax = [...document.querySelectorAll('[data-par]')];

if (parallax.length && !REDUCE) {
  let ticking = false;

  const move = () => {
    const mid = window.innerHeight / 2;
    parallax.forEach((el) => {
      const box = el.getBoundingClientRect();
      const from = (box.top + box.height / 2 - mid) / window.innerHeight;
      const shift = from * parseFloat(el.dataset.par);
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };

  const onMove = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(move);
  };

  /* Only run it on screens wide enough for the side-by-side hero. */
  if (window.matchMedia('(min-width: 941px)').matches) {
    move();
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
  }
}

/* 6. Live-work ticker — copy the row once so the slide never shows a gap -- */
const track = document.querySelector('[data-ticker]');
if (track && !REDUCE) {
  const group = track.firstElementChild;
  if (group) {
    const copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    track.appendChild(copy);
  }
}

/* 7. Silent screen recordings ---------------------------------------------
   Nothing downloads until the video reaches the screen, and it pauses again
   when it leaves. People who ask for less motion only ever see the poster. */
const videos = document.querySelectorAll('[data-vid]');

if (videos.length && !REDUCE && 'IntersectionObserver' in window) {
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const v = entry.target;
      if (entry.isIntersecting) {
        if (v.preload !== 'auto') v.preload = 'auto';
        v.play().catch(() => { /* the browser refused autoplay — poster stays */ });
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach((v) => vio.observe(v));
}

/* 8. Website example filters ---------------------------------------------- */
const chips = document.querySelectorAll('[data-filter]');
const items = document.querySelectorAll('[data-cat]');

if (chips.length && items.length) {
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const want = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      items.forEach((item) => {
        const show = want === 'all' || item.dataset.cat.split(' ').includes(want);
        item.hidden = !show;
      });
      /* Fewer cards now, so "01 / 08" has to become "01 / 03". */
      railWatchers.forEach((w) => w.rebuild());
    });
  });
}

/* 9. Year in the footer ---------------------------------------------------- */
const yr = document.querySelector('[data-year]');
if (yr) yr.textContent = new Date().getFullYear();

/* 10. Journey timeline on phones ------------------------------------------
   Below 640px the journey is a vertical line. This grows the clay fill as
   the page scrolls and switches each circle on as the fill reaches it.

   Three lengths are measured from the real circles and handed to the CSS,
   so the track begins and ends exactly on the first and last circle centres
   however long the labels are.

   It reads positions and writes two custom properties, all inside one
   requestAnimationFrame, and only while the timeline layout is actually in
   use — so nothing runs at all on a laptop.                              */
const flow = document.querySelector('.flow');

if (flow) {
  const steps = [...flow.querySelectorAll('.flow__step')];
  const dots = steps.map((s) => s.querySelector('.flow__no')).filter(Boolean);
  const phone = window.matchMedia('(max-width: 640px)');

  if (dots.length > 1) {
    /* Centre of a circle, measured from the top of the timeline. */
    const centreIn = (el, topRef) => {
      const r = el.getBoundingClientRect();
      return r.top - topRef + r.height / 2;
    };

    const measure = () => {
      const flowTop = flow.getBoundingClientRect().top;
      const first = centreIn(dots[0], flowTop);
      const last = centreIn(dots[dots.length - 1], flowTop);
      flow.style.setProperty('--flow-top', `${first.toFixed(1)}px`);
      flow.style.setProperty('--flow-track', `${(last - first).toFixed(1)}px`);
      return { first, last, flowTop };
    };

    /* Everything lit and the line drawn full, with no scrolling involved. */
    const showAll = () => {
      const m = measure();
      flow.style.setProperty('--flow-fill', `${(m.last - m.first).toFixed(1)}px`);
      steps.forEach((s) => s.classList.add('is-on'));
    };

    const clear = () => {
      flow.style.removeProperty('--flow-top');
      flow.style.removeProperty('--flow-track');
      flow.style.removeProperty('--flow-fill');
      steps.forEach((s) => s.classList.remove('is-on'));
    };

    /* The line fills to wherever the reader's eye is — a little below the
       middle of the screen, which is where attention actually sits. */
    const update = () => {
      const flowTop = flow.getBoundingClientRect().top;
      const centres = dots.map((d) => centreIn(d, flowTop));
      const start = centres[0];
      const end = centres[centres.length - 1];

      /* Where the reader's eye is, in the timeline's own coordinates. */
      const mark = window.innerHeight * 0.55 - flowTop;
      const fill = Math.max(0, Math.min(mark - start, end - start));

      flow.style.setProperty('--flow-top', `${start.toFixed(1)}px`);
      flow.style.setProperty('--flow-track', `${(end - start).toFixed(1)}px`);
      flow.style.setProperty('--flow-fill', `${fill.toFixed(1)}px`);

      steps.forEach((s, i) => s.classList.toggle('is-on', centres[i] <= mark + 1));
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { update(); queued = false; });
    };

    let live = false;
    const stop = () => {
      if (!live) return;
      live = false;
      window.removeEventListener('scroll', onScroll);
    };

    const sync = () => {
      /* Wide screen: the horizontal desktop layout is back, so undo everything. */
      if (!phone.matches) { stop(); clear(); return; }

      /* Asked for less motion: draw the finished line and leave it alone. */
      if (REDUCE) { stop(); showAll(); return; }

      if (!live) {
        live = true;
        window.addEventListener('scroll', onScroll, { passive: true });
      }
      update();
    };

    sync();
    window.addEventListener('resize', sync);
    if (phone.addEventListener) phone.addEventListener('change', sync);
  }
}

/* 11. "01 / 08" mark under the services swipe row --------------------------
   On a phone the Services cards become a row you swipe. Without a marker,
   someone seeing only the first card could think that is the whole section.
   This fills a hairline and updates the number as they swipe.

   The Website Examples section is a stacked deck, not a row, so it has no
   marker and is not handled here.

   It watches the cards with IntersectionObserver — the same tool already
   used for the scroll reveal above — instead of listening to every scroll
   event. That means code runs only when the card in view actually changes,
   which keeps a slower phone smooth.                                       */
document.querySelectorAll('.eg--rail').forEach((rail) => {
  const prog = rail.nextElementSibling;
  if (!prog || !prog.classList.contains('rail-prog')) return;

  const fill = prog.querySelector('[data-rail-fill]');
  const count = prog.querySelector('[data-rail-count]');
  if (!fill || !count) return;

  const pad = (n) => String(n).padStart(2, '0');
  let cards = [];
  let io = null;

  const setProgress = (i) => {
    if (!cards.length) return;
    fill.style.width = `${((i + 1) / cards.length) * 100}%`;
    count.textContent = `${pad(i + 1)} / ${pad(cards.length)}`;
  };

  const rebuild = () => {
    if (io) io.disconnect();
    /* Cards hidden by the industry filter are not counted, so the total
       always matches what is really swipeable right now. */
    cards = [...rail.children].filter((c) => !c.hidden);
    if (!cards.length) return;

    setProgress(0);
    if (!('IntersectionObserver' in window)) return;

    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0.6) {
          const i = cards.indexOf(entry.target);
          if (i > -1) setProgress(i);
        }
      });
    }, { root: rail, threshold: 0.6 });

    cards.forEach((c) => io.observe(c));
  };

  rebuild();
  railWatchers.push({ rebuild });
});

/* 12. Enquiry form -------------------------------------------------------
   There is no server behind this site, so the form does not post anywhere.
   It reads the boxes, writes one tidy email, and hands that to the visitor.
   Nothing is stored, sent or seen in between.

   Three ways out, because the first one silently fails more often than you
   would think — a Windows machine whose registered mail app has been removed
   just ignores a mailto link, with no error of any kind:
     1. mailto, which opens whatever mail app they have set up;
     2. a Gmail compose window, which needs no mail app at all;
     3. copy to clipboard, which works even with neither.
   Two and three only appear after they press send, so the form still looks
   like one simple button until the moment a fallback is useful.            */
const enquiry = document.querySelector('[data-enquiry]');

if (enquiry) {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeajazor';
  const TO = 'hello@pacedigitalworks.com';
  const msg = enquiry.querySelector('[data-enquiry-msg]');
  const submitBtn = enquiry.querySelector('button[type="submit"]');

  const say = (text, links = []) => {
    if (!msg) return;
    msg.textContent = text;
    links.forEach(([label, href]) => {
      const a = msg.appendChild(document.createElement('a'));
      a.textContent = label;
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    msg.hidden = false;
  };

  const answered = () =>
    [...enquiry.querySelectorAll('input, textarea')]
      .filter((f) => f.value.trim())
      .map((f) => `${f.name}: ${f.value.trim()}`);

  const bodyText = () =>
    ['Hello Chad,', '', 'I would like a website for my business.', '', ...answered(), '', 'Thank you.'].join('\n');

  const missing = () => {
    const bad = [];
    enquiry.querySelectorAll('[required]').forEach((f) => {
      const ok = f.value.trim() && (f.type !== 'email' || /^\S+@\S+\.\S+$/.test(f.value.trim()));
      f.closest('.fld').classList.toggle('is-bad', !ok);
      if (!ok) bad.push(f);
    });
    return bad;
  };

  enquiry.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = missing();

    if (bad.length) {
      bad[0].focus();
      say('Please fill in your name, your email and your business name. Everything else can stay empty.');
      return;
    }

    const name = enquiry.querySelector('#f-name').value.trim();
    const email = enquiry.querySelector('#f-email').value.trim();
    const submitTextSpan = submitBtn ? submitBtn.querySelector('.btn__t') : null;
    const originalBtnText = submitTextSpan ? submitTextSpan.textContent : 'Submit my details';

    if (submitBtn) submitBtn.disabled = true;
    if (submitTextSpan) submitTextSpan.textContent = 'Sending...';

    try {
      const data = new FormData(enquiry);
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        say(`Thank you, ${name}! Your enquiry has been received successfully. I’ll review your message and get back to you shortly.`);
        enquiry.reset();
      } else {
        const result = await response.json();
        say(result.errors ? result.errors.map((err) => err.message).join(', ') : 'There was a problem sending your form. Please try sending again or reach out via WhatsApp/Facebook.');
      }
    } catch (err) {
      say('Network connection error. Please check your internet connection or reach out directly via WhatsApp.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitTextSpan) submitTextSpan.textContent = originalBtnText;
    }
  });

  enquiry.addEventListener('input', (e) => {
    const fld = e.target.closest('.fld');
    if (fld && fld.classList.contains('is-bad')) fld.classList.remove('is-bad');
  });


}
