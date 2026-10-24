// Nav scroll state
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

// Mobile menu
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  navLinks.classList.remove('open');
}));

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  io.observe(el);
});

// Lingua (IT / EN)
const EN = window.I18N_EN || {};
const i18nEls = [...document.querySelectorAll('[data-i18n]')];
i18nEls.forEach(el => { el.dataset.it = el.innerHTML; });
const metaDesc = document.querySelector('meta[name="description"]');
const IT_META = { title: document.title, description: metaDesc.content };
let lang = 'it';
try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch (e) {}
if (new URLSearchParams(location.search).get('lang') === 'en') lang = 'en';
const ui = k => window.UI[lang][k];

const setLang = l => {
  lang = l;
  try { localStorage.setItem('lang', l); } catch (e) {}
  document.documentElement.lang = l;
  i18nEls.forEach(el => { el.innerHTML = l === 'en' && EN[el.dataset.i18n] ? EN[el.dataset.i18n] : el.dataset.it; });
  document.title = l === 'en' ? EN['meta.title'] : IT_META.title;
  metaDesc.content = l === 'en' ? EN['meta.description'] : IT_META.description;
  document.querySelectorAll('#langSwitch button').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
  renderProjects();
  if (currentProject) fillProject(currentProject);
};
document.getElementById('langSwitch').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b && b.dataset.lang !== lang) setLang(b.dataset.lang);
});

// Portfolio — dati generati in lavori.js da genera_portfolio.py
const LAVORI = window.LAVORI || [];
const projectsEl = document.getElementById('projects');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tr = o => o[lang] || o.it;
let filter = 'all';

function renderProjects() {
  projectsEl.innerHTML = LAVORI.map((l, i) => `
    <a class="project reveal in${filter !== 'all' && l.cat !== filter ? ' hide' : ''}" href="#lavoro/${l.id}" data-cat="${l.cat}">
      <div class="project-img${l.cat === 'grafica' ? ' contain' : ''}" style="background:${l.tema.bg}"><img src="${l.cover.thumb}" srcset="${l.cover.thumb} 900w, ${l.cover.full} 1800w" sizes="(max-width: 600px) 92vw, (max-width: 980px) 46vw, 30vw" alt="${esc(tr(l.titolo))}" loading="lazy" decoding="async"></div>
      <div class="project-meta">
        <span class="project-num">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <h3>${esc(tr(l.titolo))}</h3>
          <p>${esc(tr(l.catLabel))} · ${l.immagini.length} ${ui('images')}</p>
        </div>
        <span class="project-arrow">→</span>
      </div>
    </a>`).join('');
}

document.getElementById('filters').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#filters button').forEach(b => b.classList.toggle('active', b === btn));
  filter = btn.dataset.filter;
  projectsEl.querySelectorAll('.project').forEach(p => p.classList.toggle('hide', filter !== 'all' && p.dataset.cat !== filter));
});

// Project page
const pv = document.getElementById('projectView');
const pvGallery = document.getElementById('pvGallery');
let currentProject = null;

function fillProject(l) {
  const t = l.tema;
  pv.style.setProperty('--pv-bg', t.bg);
  pv.style.setProperty('--pv-fg', t.fg);
  pv.style.setProperty('--pv-accent', t.accent);
  pv.classList.toggle('dark', t.dark);
  document.getElementById('pvCat').textContent = tr(l.catLabel) + (l.anno ? ' — ' + l.anno : '');
  document.getElementById('pvTitle').textContent = tr(l.titolo);
  document.getElementById('pvDesc').textContent = tr(l.descrizione);
  document.getElementById('pvLinks').innerHTML = l.link.map(k =>
    `<a class="link-line" href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.testo)}&nbsp;↗</a>`).join('');
  document.getElementById('pvCount').textContent = `${l.immagini.length} ${ui('images')}`;
  const next = LAVORI[(LAVORI.indexOf(l) + 1) % LAVORI.length];
  document.getElementById('pvNext').innerHTML = LAVORI.length > 1 ? `
    <a href="#lavoro/${next.id}"><span class="eyebrow">${ui('next')}</span><strong>${esc(tr(next.titolo))} →</strong></a>` : '';
}

const openProject = id => {
  const l = LAVORI.find(x => x.id === id);
  if (!l) return;
  currentProject = l;
  fillProject(l);
  layoutGallery();
  pv.classList.add('open');
  pv.setAttribute('aria-hidden', 'false');
  pv.scrollTop = 0;
  document.body.style.overflow = 'hidden';
};
const closeProject = () => {
  pv.classList.remove('open');
  pv.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentProject = null;
};
// Galleria: numero di colonne in base a schermo, formato delle immagini e tipo di lavoro
function galleryCols(l) {
  const w = innerWidth;
  let n = w >= 1700 ? 4 : w >= 1100 ? 3 : 2;
  const ratio = l.immagini.reduce((t, im) => t + im.w / im.h, 0) / l.immagini.length;
  if (ratio > 1.25) n -= 1;                       // foto orizzontali: colonne più larghe
  if (w < 600 && l.cat === 'grafica') n = 1;      // menù e grafiche leggibili su smartphone
  return Math.max(1, Math.min(n, l.immagini.length));
}

// Masonry che mantiene l'ordine da sinistra a destra
function layoutGallery() {
  if (!currentProject) return;
  const l = currentProject;
  const n = galleryCols(l);
  const cols = Array.from({ length: n }, () => ({ h: 0, html: '' }));
  const sizes = n === 1 ? '(max-width: 760px) 94vw, 70vw' : `${Math.ceil(100 / n)}vw`;
  l.immagini.forEach((im, i) => {
    const col = cols.reduce((a, b) => (b.h < a.h ? b : a));
    col.h += im.h / im.w;
    col.html += `<figure data-i="${i}" style="aspect-ratio:${im.w}/${im.h}">
      <img src="${im.thumb}" srcset="${im.thumb} 900w, ${im.full} 1800w" sizes="${sizes}"
        alt="${esc(tr(l.titolo))} — ${i + 1}" loading="${i < n * 2 ? 'eager' : 'lazy'}" decoding="async"
        onload="this.classList.add('loaded')"></figure>`;
  });
  pvGallery.innerHTML = cols.map(c => `<div class="pv-col">${c.html}</div>`).join('');
  pvGallery.dataset.cols = n;
  pvGallery.classList.toggle('single', n === 1);
}
let resizeT;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    if (currentProject && +pvGallery.dataset.cols !== galleryCols(currentProject)) layoutGallery();
  }, 150);
});

const route = () => {
  const m = location.hash.match(/^#lavoro\/(.+)$/);
  if (m) openProject(decodeURIComponent(m[1]));
  else if (currentProject) closeProject();
};
addEventListener('hashchange', route);
setLang(lang);
route();
document.getElementById('pvBack').addEventListener('click', () => { location.hash = 'portfolio'; });
pvGallery.addEventListener('click', e => {
  const fig = e.target.closest('figure');
  if (fig) openLightbox(+fig.dataset.i);
});

// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
let lbIndex = 0;
const showLb = i => {
  const imgs = currentProject.immagini;
  lbIndex = (i + imgs.length) % imgs.length;
  lbImg.src = imgs[lbIndex].full;
  lbImg.alt = `${tr(currentProject.titolo)} — ${lbIndex + 1}`;
  document.getElementById('lbCounter').textContent = `${lbIndex + 1} / ${imgs.length}`;
  [imgs[lbIndex + 1], imgs[lbIndex - 1]].forEach(n => { if (n) new Image().src = n.full; });
};
const openLightbox = i => { showLb(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); };
const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
document.getElementById('lbPrev').addEventListener('click', e => { e.stopPropagation(); showLb(lbIndex - 1); });
document.getElementById('lbNext').addEventListener('click', e => { e.stopPropagation(); showLb(lbIndex + 1); });
lb.addEventListener('click', e => { if (e.target === lb || e.target.id === 'lbClose') closeLb(); });
addEventListener('keydown', e => {
  if (lb.classList.contains('open')) {
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
  } else if (e.key === 'Escape' && currentProject) location.hash = 'portfolio';
});
let touchX = null;
lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});
