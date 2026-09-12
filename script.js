/* ==========================================================
   Nav: scrolled state + mobile toggle + active link
   ========================================================== */
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.classList.toggle('active');
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
      })
    );
  }

  const current = document.body.dataset.page;
  if (current) {
    document.querySelectorAll('.nav-links a[data-page]').forEach((a) => {
      if (a.dataset.page === current) a.classList.add('active');
    });
  }
})();

/* ==========================================================
   Scroll Reveal
   ========================================================== */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => io.observe(el));
})();

/* ==========================================================
   Hero Typing Animation
   ========================================================== */
(function () {
  const el = document.querySelector('[data-typing]');
  if (!el) return;

  let words = [];
  try {
    words = JSON.parse(el.dataset.typing);
  } catch (e) {
    words = [el.textContent.trim()];
  }
  if (!words.length) return;

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_SPEED = 90;
  const DELETE_SPEED = 45;
  const HOLD = 1600;

  function tick() {
    const word = words[wordIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        return setTimeout(tick, HOLD);
      }
      return setTimeout(tick, TYPE_SPEED);
    }

    charIndex--;
    el.textContent = word.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      return setTimeout(tick, 300);
    }
    return setTimeout(tick, DELETE_SPEED);
  }

  tick();
})();

/* ==========================================================
   Filter Buttons (Projects / Photography pages)
   ========================================================== */
(function () {
  const bar = document.querySelector('[data-filter-bar]');
  if (!bar) return;

  const buttons = bar.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('[data-category]');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
})();
