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
const revealObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      )
    : null;

function observeReveal(root) {
  root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('is-visible');
  });
}

observeReveal(document);

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

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    bar.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));

    const filter = btn.dataset.filter;
    document.querySelectorAll('[data-category]').forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? '' : 'none';
    });
  });
})();

/* ==========================================================
   Content rendering from data/*.json (edited via /admin)
   ========================================================== */
const ICONS = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  frame: '<rect x="3" y="4" width="18" height="14" rx="1.5"/><path d="M3 9h18M8 4v14"/>',
  chart: '<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  house: '<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/>',
  camera: '<rect x="3" y="7" width="14" height="12" rx="2"/><path d="M17 10l4-2v10l-4-2"/>',
  lens: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  laptop: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  printer: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M4 8h4M4 16h4"/>',
};

const CATEGORY_LABELS = {
  design: 'Mechanical Design',
  prototype: 'Prototyping',
  analysis: 'Structural Analysis',
  ongoing: 'Ongoing',
};

const DIM_PATHS = {
  featured: { viewBox: '0 0 400 220', d: 'M20 40 H 200 M20 40 V 30 M200 40 V 30 M20 180 H 380 M20 180 V 190 M380 180 V 190' },
  grid: { viewBox: '0 0 320 180', d: 'M16 32 H 160 M16 32 V 24 M160 32 V 24 M16 150 H 300 M16 150 V 158 M300 150 V 158' },
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function svgIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${ICONS[name] || ICONS.gear}</svg>`;
}

// The CMS may save "/HS-portfolio/images/x.jpg"; pages live at the site root, so use a relative path.
function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return path.replace(/^\/(HS-portfolio\/)?/, '');
}

function paragraphs(text, style) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="reveal" style="${style}">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function tagsHtml(tags, style) {
  if (!tags || !tags.length) return '';
  return `<div class="project-tags"${style ? ` style="${style}"` : ''}>${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
}

async function loadData(name) {
  const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`data/${name}.json: ${res.status}`);
  return res.json();
}

/* ---------- Projects ---------- */
function hasDetail(p) {
  return Boolean(p.intro || p.overview || p.results || (p.process || []).length || (p.gallery || []).length);
}

function detailUrl(p) {
  return `project-detail.html?id=${encodeURIComponent(p.id)}`;
}

function projectThumb(p, variant) {
  const dim = DIM_PATHS[variant];
  const tag = p.thumbTag ? `<span class="ph-tag">${esc(p.thumbTag)}</span>` : '';
  const overlay =
    p.dimA || p.dimB
      ? `<div class="dim-overlay" aria-hidden="true">
           <svg viewBox="${dim.viewBox}"><path class="dim-line" d="${dim.d}"/></svg>
           ${p.dimA ? `<span class="dim-label tl">${esc(p.dimA)}</span>` : ''}
           ${p.dimB ? `<span class="dim-label br">${esc(p.dimB)}</span>` : ''}
         </div>`
      : '';

  if (p.thumbnail) {
    return `<div class="project-thumb project-thumb-img"><img src="${esc(assetUrl(p.thumbnail))}" alt="${esc(p.title)}" loading="lazy">${tag}${overlay}</div>`;
  }
  return `<div class="project-thumb ph"><div class="ph-icon">${svgIcon(p.icon)}</div>${tag}${overlay}</div>`;
}

function projectCard(p, variant) {
  const spec = variant === 'grid' && p.specs && p.specs[0]
    ? `<div class="spec-row"><span>${esc(p.specs[0].label)}</span><strong>${esc(p.specs[0].value)}</strong></div>`
    : '';
  const link = hasDetail(p) ? `<a href="${detailUrl(p)}" class="card-link">자세히 보기 →</a>` : '';
  const category = variant === 'grid' ? ` data-category="${esc(p.category)}"` : '';

  return `<article class="project-card reveal"${category}>
    ${projectThumb(p, variant)}
    <div class="project-body">
      <span class="project-cat">${esc(CATEGORY_LABELS[p.category] || p.category)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      ${tagsHtml(p.tags)}
      ${spec}
      ${link}
    </div>
  </article>`;
}

function renderProjectDetail(el, data) {
  const list = data.projects.projects || [];
  const id = new URLSearchParams(location.search).get('id');
  const idx = id ? list.findIndex((p) => p.id === id) : list.findIndex(hasDetail);
  const p = list[idx];

  if (!p) {
    el.innerHTML = `<section class="page-header"><div class="container">
      <h1>프로젝트를 찾을 수 없어요</h1>
      <a href="projects.html" class="btn btn-ghost" style="margin-top:16px;">← 프로젝트 목록으로</a>
    </div></section>`;
    return;
  }

  document.title = `${p.title} — Hanseo Ju`;
  const textStyle = 'color:var(--text-secondary); margin-bottom:16px; font-size:1.05rem;';

  const visual = p.thumbnail
    ? `<div class="project-thumb project-thumb-img detail-visual reveal"><img src="${esc(assetUrl(p.thumbnail))}" alt="${esc(p.title)}"></div>`
    : `<div class="project-thumb ph detail-visual reveal"><div class="ph-icon">${svgIcon(p.icon)}</div><span class="ph-tag">MAIN RENDER</span></div>`;

  const specs = (p.specs || []).length
    ? `<div class="gear-card" style="flex-direction:column; align-items:flex-start; gap:18px;"><div style="width:100%;">
        ${p.specs.map((s, i) => `<div class="spec-row"${i === 0 ? ' style="margin-top:0;"' : ''}><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></div>`).join('')}
      </div></div>`
    : '';

  const overview = p.overview
    ? `<section class="section" style="padding-top:0;"><div class="container" style="max-width:820px;">
        <h2 class="section-title reveal" style="margin-bottom:20px;">Overview</h2>
        ${paragraphs(p.overview, textStyle)}
      </div></section>`
    : '';

  const process = (p.process || []).length
    ? `<section class="section" style="padding-top:0;"><div class="container">
        <div class="section-head"><div>
          <p class="eyebrow reveal" style="margin-bottom:10px;">Process</p>
          <h2 class="section-title reveal">설계 과정</h2>
        </div></div>
        <div class="timeline">
          ${p.process.map((s, i) => `<div class="timeline-item reveal">
            <div class="timeline-date">STEP ${String(i + 1).padStart(2, '0')}</div>
            <h4>${esc(s.title)}</h4>
            ${s.body ? `<p>${esc(s.body)}</p>` : ''}
          </div>`).join('')}
        </div>
      </div></section>`
    : '';

  const placeholderIcons = ['frame', 'house', 'chart'];
  const gallery = (p.gallery || []).length
    ? `<section class="section" style="padding-top:0;"><div class="container">
        <div class="section-head"><div>
          <p class="eyebrow reveal" style="margin-bottom:10px;">Gallery</p>
          <h2 class="section-title reveal">제작 과정 사진 · 렌더</h2>
        </div></div>
        <div class="photo-strip reveal-group">
          ${p.gallery.map((g, i) => {
            const caption = g.caption ? `<span class="ph-tag">${esc(g.caption)}</span>` : '';
            return g.image
              ? `<div class="photo-card reveal"><img class="photo-real" src="${esc(assetUrl(g.image))}" alt="${esc(g.caption || p.title)}" loading="lazy">${caption}</div>`
              : `<div class="photo-card reveal"><div class="ph${i % 2 ? ' ph-cream' : ''}"><div class="ph-icon">${svgIcon(placeholderIcons[i % 3])}</div>${caption}</div></div>`;
          }).join('')}
        </div>
      </div></section>`
    : '';

  const results = p.results
    ? `<section class="section" style="padding-top:0;"><div class="container" style="max-width:820px;">
        <h2 class="section-title reveal" style="margin-bottom:20px;">Results &amp; Lessons Learned</h2>
        ${paragraphs(p.results, textStyle)}
      </div></section>`
    : '';

  const next = list.length > 1 ? list[(idx + 1) % list.length] : null;
  const nextSection = next
    ? `<section class="section" style="padding-top:0;"><div class="container">
        <div class="teaser reveal" style="grid-template-columns: 1fr; text-align:center;"><div>
          <p class="eyebrow" style="margin-bottom:10px;">Next Project</p>
          <h2 style="margin-bottom:24px;">${esc(next.title)}</h2>
          ${hasDetail(next)
            ? `<a href="${detailUrl(next)}" class="btn btn-primary">다음 프로젝트 보기 →</a>`
            : `<a href="projects.html" class="btn btn-primary">모든 프로젝트 보기 →</a>`}
        </div></div>
      </div></section>`
    : '';

  el.innerHTML = `
    <section class="page-header"><div class="container">
      <a href="projects.html" class="btn btn-ghost reveal" style="margin-bottom:24px;">← 프로젝트 목록으로</a>
      <p class="eyebrow reveal">${esc(CATEGORY_LABELS[p.category] || p.category)}</p>
      <h1 class="reveal">${esc(p.title)}</h1>
      ${p.intro ? `<p class="reveal">${esc(p.intro)}</p>` : ''}
    </div></section>

    <section class="section" style="padding-bottom:60px;"><div class="container">
      <div class="about-hero detail-hero">
        ${visual}
        <div class="reveal">${specs}${tagsHtml(p.tags, 'margin-top:20px;')}</div>
      </div>
    </div></section>

    ${overview}${process}${gallery}${results}${nextSection}`;
}

/* ---------- Photos ---------- */
function photoMeta(ph) {
  const iso = ph.iso ? `ISO ${String(ph.iso).replace(/^ISO\s*/i, '')}` : '';
  return [ph.focal, ph.aperture, ph.shutter, iso].filter(Boolean).join(' · ');
}

function photoCard(ph, i, variant) {
  const shape = variant === 'gallery' ? ` h-${ph.shape || 'square'}` : '';
  const category = variant === 'gallery' ? ` data-category="${esc(ph.category)}"` : '';
  const alt = [ph.alt, ph.date].filter(Boolean).join(', ');
  const media = ph.image
    ? `<img class="photo-real" src="${esc(assetUrl(ph.image))}" alt="${esc(alt)}" loading="lazy">`
    : `<div class="ph${i % 2 ? ' ph-cream' : ''}"><div class="ph-icon">${svgIcon('photo')}</div></div>`;
  const meta = photoMeta(ph);

  return `<div class="photo-card reveal${shape}"${category}>
    ${media}
    <div class="hud">
      <span class="hud-rec"><span class="dot"></span>REC</span>
      <div class="hud-corner tl"></div><div class="hud-corner tr"></div>
      <div class="hud-corner bl"></div><div class="hud-corner br"></div>
      <div class="hud-crosshair"></div>
      ${meta ? `<div class="hud-meta">${esc(meta)}</div>` : ''}
    </div>
  </div>`;
}

/* ---------- Registry ---------- */
const RENDERERS = {
  'featured-projects': {
    source: 'projects',
    render: (el, d) => {
      el.innerHTML = (d.projects.projects || []).filter((p) => p.featured).slice(0, 2).map((p) => projectCard(p, 'featured')).join('');
    },
  },
  projects: {
    source: 'projects',
    render: (el, d) => {
      el.innerHTML = (d.projects.projects || []).map((p) => projectCard(p, 'grid')).join('');
    },
  },
  'project-detail': { source: 'projects', render: renderProjectDetail },
  'home-photos': {
    source: 'photos',
    render: (el, d) => {
      el.innerHTML = (d.photos.photos || []).filter((ph) => ph.home).slice(0, 3).map((ph, i) => photoCard(ph, i, 'strip')).join('');
    },
  },
  photos: {
    source: 'photos',
    render: (el, d) => {
      el.innerHTML = (d.photos.photos || []).map((ph, i) => photoCard(ph, i, 'gallery')).join('');
    },
  },
  timeline: {
    source: 'about',
    render: (el, d) => {
      el.innerHTML = (d.about.timeline || []).map((t) => `<div class="timeline-item reveal">
        <div class="timeline-date">${esc(t.date)}</div>
        <h4>${esc(t.title)}</h4>
        ${t.body ? `<p>${esc(t.body)}</p>` : ''}
      </div>`).join('');
    },
  },
  skills: {
    source: 'about',
    render: (el, d) => {
      el.innerHTML = (d.about.skills || []).map((s) => `<span class="skill-badge reveal">${esc(s)}</span>`).join('');
    },
  },
  gear: {
    source: 'about',
    render: (el, d) => {
      el.innerHTML = (d.about.gear || []).map((g) => `<div class="gear-card reveal">
        <div class="gear-icon">${svgIcon(g.icon)}</div>
        <div><h4>${esc(g.name)}</h4><span>${esc(g.sub)}</span></div>
      </div>`).join('');
    },
  },
};

(async function renderContent() {
  const targets = [...document.querySelectorAll('[data-render]')].filter((el) => RENDERERS[el.dataset.render]);
  if (!targets.length) return;

  const sources = [...new Set(targets.map((el) => RENDERERS[el.dataset.render].source))];
  const data = {};

  try {
    await Promise.all(sources.map(async (name) => { data[name] = await loadData(name); }));
  } catch (err) {
    console.error(err);
    targets.forEach((el) => {
      el.innerHTML = '<p class="load-error">콘텐츠를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>';
    });
    return;
  }

  targets.forEach((el) => {
    RENDERERS[el.dataset.render].render(el, data);
    observeReveal(el);
  });
})();
