/* Interaction layer for the pen-exported page. Layout is untouched; this only adds behaviour. */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const N = n => `[data-pencil-name="${n}"]`;
const byName = (n, r = document) => $$(N(n), r);
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const root = $(N('Care Guide Homepage'));
const sec = [...root.children]; // Hero, Services, About, Stats, Leadership, Why, Culture, Careers, Blog, CTA, Footer
const S = { hero: sec[0], services: sec[1], about: sec[2], stats: sec[3], lead: sec[4], why: sec[5], culture: sec[6], careers: sec[7], blog: sec[8], cta: sec[9], footer: sec[10] };

/* design is 1440 wide: scale it down on narrower screens */
/* The design is 1440 wide.
   <=1440: scale it down to fit.  >1440: side padding grows (80px at 1440 -> 260px at 1920, then proportional)
   and the content width (1280 design px) is scaled to fill what is left; section backgrounds bleed to the screen edges. */
const fit = () => {
  const vw = document.documentElement.clientWidth, b = document.body;
  const fluid = vw <= 1100, sm = vw <= 640;                       // <=1100: the layout reflows instead of scaling
  const wide = vw > 1440, P = !wide ? 80 : vw < 1920 ? 80 + (vw - 1440) * .375 : vw * 260 / 1920; // side padding in screen px
  const z = fluid ? 1 : wide ? (vw - 2 * P) / 1280 : vw / 1440;
  const pd = fluid ? (sm ? 20 : 40) : wide ? P / z : 80;
  b.style.zoom = z; b.style.setProperty('--z', z); b.style.setProperty('--pd', pd + 'px');
  const avail = vw - 2 * pd, cz = sm ? .5 : Math.min(1, avail / 1280); // card-stack scale in reflow mode (phones show it larger, side cards peek in from the edges)
  b.style.setProperty('--cz', cz); b.style.setProperty('--cm', (avail - 1280 * cz) / (2 * cz) + 'px');
  b.classList.toggle('cg-wide', wide); b.classList.toggle('cg-fluid', fluid); b.classList.toggle('cg-sm', sm);
  if (!fluid) b.classList.remove('cg-menu');
};
fit(); addEventListener('resize', fit);
sec.forEach(s => s.style.setProperty('--sbg', getComputedStyle(s).backgroundColor)); // for the full-bleed background

/* Decoration that is positioned in page coordinates is re-parented into the element it belongs to, using % positions,
   so it stays attached when the layout reflows on tablet / phone. (Desktop positions are unchanged.) */
function adopt(host, kids, ox, oy, W, H) { // (ox, oy) = host origin and (W, H) = host size in the pen's page coordinates
  if (!host) return; host.style.position = 'relative';
  kids.filter(Boolean).forEach(k => { k.style.left = (parseFloat(k.style.left) - ox) / W * 100 + '%'; k.style.top = (parseFloat(k.style.top) - oy) / H * 100 + '%'; host.append(k); });
}
adopt(byName('Hero Team Image')[0], [...$$('[data-pencil-name^="Glass Chip"]', S.hero), byName('Play Button', S.hero)[0]], 800, 231, 560, 500);
adopt(byName('About Image', S.about)[0], [byName('Years Badge', S.about)[0]], 80, 208, 580, 620);
adopt(byName('CEO Portrait', S.lead)[0], [byName('Badge Ring', S.lead)[0], byName('Quote Badge', S.lead)[0], byName('Quote Icon', S.lead)[0]], 820, 157.5, 540, 540);

/* mobile menu button */
{
  const burger = document.createElement('button'); burger.className = 'cg-burger'; burger.setAttribute('aria-label', 'Menu'); burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = '<i></i>';
  burger.addEventListener('click', () => { const o = document.body.classList.toggle('cg-menu'); burger.setAttribute('aria-expanded', o); });
  $(N('Nav')).append(burger);
  $$(N('Links') + '>div').forEach(l => l.addEventListener('click', () => { document.body.classList.remove('cg-menu'); burger.setAttribute('aria-expanded', 'false'); }));
}

/* helpers */
const click = (el, fn, label) => { el.classList.add('cg-btn'); el.setAttribute('role', 'button'); el.tabIndex = 0; if (label) el.setAttribute('aria-label', label);
  el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } }); };
const goto = el => el && el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });

/* nav state */
const nav = $(N('Nav')), links = $$(N('Links') + '>div');
const targets = [S.hero, S.about, S.services, S.culture, S.cta, S.careers, S.blog];
links.forEach((l, i) => { l.setAttribute('role', 'link'); l.tabIndex = 0; l.addEventListener('click', () => goto(targets[i])); l.addEventListener('keydown', e => e.key === 'Enter' && goto(targets[i])); });
const onScroll = () => {
  document.body.classList.toggle('scrolled', scrollY > 40);
  let cur = 0; targets.forEach((t, i) => { if (t.getBoundingClientRect().top < innerHeight * .4) cur = i; });
  links.forEach((l, i) => l.classList.toggle('on', i === cur));
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* buttons: ripple + magnetic + click targets */
const ctaScroll = () => goto(S.cta);
[byName('Nav CTA')[0], ...byName('Primary Button'), ...byName('Secondary Button'), byName('Learn More Button')[0], byName('Apply Button')[0], byName('Clients Review Button')[0]].filter(Boolean)
  .forEach(b => click(b, ctaScroll));
[byName('All Services')[0], byName('View All')[0]].filter(Boolean).forEach(b => { b.classList.add('cg-link'); b.setAttribute('role', 'link'); b.tabIndex = 0; });
byName('Read More').forEach(b => { b.classList.add('cg-link'); });
document.addEventListener('click', e => {
  const b = e.target.closest('.cg-btn'); if (!b) return;
  const r = b.getBoundingClientRect(), z = +document.body.style.zoom || 1, s = Math.max(r.width, r.height) / z, d = document.createElement('span');
  d.className = 'cg-ripple'; d.style.cssText = `width:${s}px;height:${s}px;left:${(e.clientX - r.left) / z - s / 2}px;top:${(e.clientY - r.top) / z - s / 2}px`;
  b.append(d); setTimeout(() => d.remove(), 600);
});
if (!reduce && matchMedia('(hover:hover)').matches) {
  $$('.cg-btn').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
}

/* hero: headline word reveal, parallax */
const h1 = byName('Headline')[0];
h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w, i) => `<span class="cg-w"><b style="--i:${i}">${w}</b></span>`).join(' ');
if (!reduce && matchMedia('(hover:hover)').matches) {
  const img = byName('Hero Team Image')[0], badges = $$('[data-pencil-name^="Badge "]');
  S.hero.addEventListener('pointermove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    img.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    badges.forEach((b, i) => b.style.translate = `${-x * (10 + i * 4)}px ${-y * (10 + i * 4)}px`);
  });
  S.hero.addEventListener('pointerleave', () => { img.style.transform = ''; badges.forEach(b => b.style.translate = ''); });
  /* tilt + spotlight on service cards */
  $$(`${N('Row 1')}>div, ${N('Row 2')}>div`).forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      c.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 8}deg) translateY(-6px)`;
    });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
}

/* hero: the dashed orbit circle turns slowly and carries the six icon badges around it (icons stay upright) */
function orbitize(icons, CX, CY, R, dur, ring) {
  const orb = document.createElement('div'); orb.className = 'cg-orbit';
  orb.style.cssText = `left:${CX}px;top:${CY}px;--dur:${dur}s;z-index:${ring ? 4 : 6}`;
  icons[0].parentElement.insertBefore(orb, ring || icons[0]);
  if (ring) { ring.style.left = -CX + 'px'; ring.style.top = -CY + 'px'; orb.append(ring); }
  const a0 = Math.atan2(parseFloat(icons[0].style.top) + 28 - CY, parseFloat(icons[0].style.left) + 28 - CX);
  icons.forEach((b, i) => {
    const a = a0 + i * 2 * Math.PI / icons.length; // equal spacing, starting from the first icon's original angle
    b.style.left = (R * Math.cos(a) - 28) + 'px'; b.style.top = (R * Math.sin(a) - 28) + 'px';
    orb.append(b); if (b.firstElementChild) b.firstElementChild.classList.add('cg-ico');
  });
}
orbitize($$('[data-pencil-name^="Badge "]', S.hero).filter(b => b.dataset.pencilName !== 'Badge Ring'), 1080, 409, 370, 80, byName('Orbit Dashed')[0]);
orbitize($$('[data-pencil-name^="Orbit Badge"]', S.about), 370, 481, 330, 60); // about: three icons, 120° apart on the outer ring

/* services: the "selected" (navy) card moves to whichever card you hover; it fills in from the pointer and jumps */
{
  const cards = $$(`${N('Row 1')}>div, ${N('Row 2')}>div`), first = cards[0];
  const rings = $$(N('Beacon Ring'), first), W0 = first.offsetWidth;
  cards.forEach(c => {
    c.classList.add('cg-sv'); c.tabIndex = 0;
    if (c !== first) rings.forEach(r => { const k = r.cloneNode(true); k.style.left = (c.offsetWidth - (W0 - parseFloat(r.style.left))) + 'px'; c.prepend(k); });
  });
  first.classList.add('sel');
  const select = (c, e) => {
    if (c.classList.contains('sel')) return;
    if (e && e.clientX != null) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%'); c.style.setProperty('--my', (e.clientY - r.top) / r.height * 100 + '%'); }
    cards.forEach(o => o.classList.toggle('sel', o === c));
    c.classList.remove('cg-jump'); void c.offsetWidth; c.classList.add('cg-jump');
  };
  cards.forEach(c => { c.addEventListener('pointerenter', e => select(c, e)); c.addEventListener('focus', () => select(c)); });
}

/* testimonial: glass card follows the pointer; quote badge spins a full turn on hover */
{
  const card = $(N('Copy'), S.lead);
  if (card && !reduce && matchMedia('(hover:hover)').matches) {
    card.classList.add('cg-card');
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
      card.style.transform = `perspective(1100px) rotateX(${(.5 - y) * 7}deg) rotateY(${(x - .5) * 9}deg) translateY(-4px)`;
      card.classList.add('hot');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; card.classList.remove('hot'); });
  }
  const spin = [byName('Quote Badge', S.lead)[0], byName('Quote Icon', S.lead)[0]].filter(Boolean);
  const portrait = byName('CEO Portrait', S.lead)[0];
  [portrait, ...spin].forEach(el => el && el.addEventListener('pointerenter', () => {
    spin.forEach(s => { s.classList.remove('cg-spin1'); void s.offsetWidth; s.classList.add('cg-spin1'); setTimeout(() => s.classList.remove('cg-spin1'), 950); });
  }));
}

/* testimonial arrows / dots: the CEO quote plus two DUMMY client testimonials (placeholder text, to test the arrows) */
{
  const q = byName('Quote', S.lead)[0], qd = byName('Quote Detail', S.lead)[0], nm = byName('Name', S.lead)[0], rl = byName('Role', S.lead)[0];
  const au = byName('Author', S.lead)[0], pt = byName('CEO Portrait', S.lead)[0], pg = byName('Review Pagination', S.lead)[0];
  const dots = [...byName('Dots', pg)[0].children];
  const clean = s => s.textContent.trim();
  const T = [
    { q: clean(q), d: clean(qd), n: clean(nm), r: clean(rl), bg: pt.style.backgroundImage, size: pt.style.backgroundSize, pos: pt.style.backgroundPosition },
    { q: '“Care Guide took over our billing and reporting within a month, and our team finally has time to focus on patients.”',
      d: '“Their communication is clear, deadlines are met, and every report arrives accurate and on time.”',
      n: 'Rahim Uddin', r: 'Operations Director (sample client)', bg: "url('assets/ev4.webp')", size: '250% auto', pos: '30% 38%', round: true },
    { q: '“From automation to SEO, one team handled it all. Our workflows are faster and our website traffic keeps growing.”',
      d: '“Working with Care Guide feels like having an in-house team that is always one step ahead.”',
      n: 'Farzana Haque', r: 'Marketing Lead (sample client)', bg: "url('assets/blog1.webp')", size: 'cover', pos: '30% 30%', round: true },
  ];
  let cur = 0, busy = false;
  const show = i => {
    if (busy) return; busy = true; cur = (i + T.length) % T.length; const t = T[cur];
    [q, qd, au].forEach(e => e.classList.add('cg-out'));
    setTimeout(() => {
      q.textContent = t.q; qd.textContent = t.d; nm.textContent = t.n; rl.textContent = t.r;
      pt.style.backgroundImage = t.bg; pt.style.backgroundSize = t.size || 'cover'; pt.style.backgroundPosition = t.pos || 'center'; pt.style.borderRadius = t.round ? '50%' : ''; // the CEO photo is already a circular cut-out
      pt.classList.remove('cg-swap'); void pt.offsetWidth; pt.classList.add('cg-swap');
      [q, qd, au].forEach(e => e.classList.remove('cg-out'));
      dots.forEach((d, k) => { d.style.width = k === cur ? '28px' : '8px'; d.style.borderRadius = '999px'; d.style.backgroundColor = k === cur ? '#F0521E' : '#C9CEDB'; });
      busy = false;
    }, 260);
  };
  const prev = byName('Previous Review', S.lead)[0], next = byName('Next Review', S.lead)[0];
  click(prev, () => show(cur - 1), 'Previous testimonial'); click(next, () => show(cur + 1), 'Next testimonial');
  dots.forEach((d, k) => { d.style.cursor = 'pointer'; d.addEventListener('click', () => show(k)); });
}

/* video dialog */
const dlg = document.createElement('dialog'); dlg.id = 'cg-dlg';
dlg.innerHTML = '<h3>Meet Care Guide</h3><p>The intro video is not wired up yet. Put your video URL in this dialog.</p><button>Close</button>';
document.body.append(dlg); dlg.querySelector('button').onclick = () => dlg.close(); dlg.addEventListener('click', e => e.target === dlg && dlg.close());
click(byName('Play Button')[0], () => dlg.showModal(), 'Play video');

/* reveal on scroll */
const rvTargets = [
  ...byName('Title Block').map(e => [e, 'tb']), ...byName('Eyebrow').map(e => [e]),
  ...$$(`${N('Row 1')}>div, ${N('Row 2')}>div`).map(e => [e, 'z']),
  ...$$(`${N('Column A')}>div, ${N('Column B')}>div`).map(e => [e]),
  ...byName('Serving Callout').map(e => [e]), ...byName('Body').map(e => [e]),
  ...$$(`${N('Stats Row')}>div`).map(e => [e]),
  ...byName('Glass Tile').map(e => [e, 'z']), ...$$(`${N('Requirement Cards')} [data-pencil-name^="Card "]`).map(e => [e, 'z']),
  ...byName('Post Card Careers').concat(byName('Post Card Content'), byName('Post Card Creative')).map(e => [e]),
  ...byName('Newsletter Card').map(e => [e]), ...byName('Copy').map(e => [e]),
];
const seen = new Set();
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; el.classList.add('in'); io.unobserve(el);
  $$('[data-count]', el).forEach(count); if (el.dataset.count) count(el);
  setTimeout(() => { if (!el.classList.contains('cg-tb')) { el.classList.remove('cg-rv', 'cg-z', 'in'); el.style.removeProperty('--d'); } }, 1400);
}), { threshold: .12 });
rvTargets.forEach(([el, kind], i) => {
  if (seen.has(el)) return; seen.add(el);
  if (kind === 'tb') el.classList.add('cg-tb'); else { el.classList.add('cg-rv'); if (kind === 'z') el.classList.add('cg-z'); el.style.setProperty('--d', (i % 4) * 90 + 'ms'); }
  io.observe(el);
});

/* count-up numbers */
function count(el) {
  const m = el.textContent.trim().match(/^(\d+)(.*)$/); if (!m || el.dataset.done) return; el.dataset.done = 1;
  const to = +m[1], suf = m[2], t0 = performance.now();
  (function f(t) { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
}
const counters = [...byName('Value'), ...byName('Years')];
const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); io2.unobserve(e.target); } }), { threshold: .4 });
counters.forEach(c => io2.observe(c));

/* team-event card stack.
   Five real cards that physically move between the five stack positions (left-outer, left-inner, active, right-inner,
   right-outer) taken from the pen. "Next" slides every card one position along; the card that leaves the far left
   fades and re-enters at the far right, so the stack feels continuous. */
const ROLES = ['Fan Left Outer', 'Fan Left Inner', 'Active Card', 'Fan Right Inner', 'Fan Right Outer'].map(n => byName(n)[0]);
const GEOM = ROLES.map(e => ({ left: e.style.left, top: e.style.top, width: e.style.width, height: e.style.height, transform: e.style.transform, zIndex: e.style.zIndex, boxShadow: e.style.boxShadow }));
const VEIL = [.8, .7, 0, .7, .8];                                    // surface-colour veil per position (pen: CC / B3 / none)
const ROLE_OF = [2, 3, 4, 0, 1];                                     // card n steps after the active one sits at this position
const CARDS = [ROLES[2], ROLES[3], ROLES[4], ROLES[0], ROLES[1]];    // card order = photo order ev1..ev5
const CAPS = ['Care Guide Christmas Party 2024 at Dhaka Regency', 'Care Guide Team Event', 'Care Guide Team Event', 'Care Guide Team Event', 'Care Guide Team Event'];
const tagSrc = byName('Tag', ROLES[2])[0], capSrc = byName('Glass Caption', ROLES[2])[0], veilSrc = byName('Veil', ROLES[0])[0];
const NUMS = [];
CARDS.forEach((c, n) => {
  c.style.backgroundImage = `url('assets/ev${n + 1}.webp')`; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center';
  c.style.display = 'flex'; c.style.flexDirection = 'column'; c.style.justifyContent = 'space-between'; c.style.padding = '18px'; c.style.overflow = 'hidden';
  if (c !== ROLES[2]) { c.replaceChildren(); [tagSrc, capSrc].forEach(s => { const k = s.cloneNode(true); k.style.position = 'relative'; k.style.zIndex = 2; c.append(k); }); }
  const v = veilSrc.cloneNode(true); v.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#F5F6F9;z-index:1;pointer-events:none;transition:opacity .7s ease'; v.style.opacity = VEIL[ROLE_OF[n]];
  c.append(v);
  const cap = byName('Glass Caption', c)[0], tag = byName('Tag', c)[0];
  [tag, cap].forEach(e => { e.style.position = 'relative'; e.style.zIndex = 2; e.style.transition = 'opacity .5s ease .15s'; });
  byName('Number', cap)[0].textContent = String(n + 1).padStart(2, '0'); byName('Caption', cap)[0].textContent = CAPS[n];
  c._v = v; c._ui = [tag, cap];
});
const counter = byName('Counter')[0], pag = byName('Pagination')[0];
const dots = [...pag.children];
const ACT = { w: '28px', bg: '#F0521E' }, OFF = { w: '8px', bg: '#9AA1B2' };
let cur = -1, auto;
const place = (c, role) => {
  const g = GEOM[role];
  Object.assign(c.style, { left: g.left, top: g.top, width: g.width, height: g.height, transform: g.transform, zIndex: g.zIndex, boxShadow: g.boxShadow });
  c._v.style.opacity = VEIL[role]; c._ui.forEach(e => e.style.opacity = role === 2 ? 1 : 0); c._role = role;
};
function go(i) {
  const next = (i + 5) % 5, first = cur < 0; cur = next;
  CARDS.forEach((c, n) => {
    const role = ROLE_OF[(n - cur + 5) % 5];
    if (first) { c.classList.add('cg-card3'); place(c, role); return; }
    if (Math.abs(role - c._role) >= 3) { // wraps around the stack: fade out, jump, fade in
      c.style.opacity = 0;
      setTimeout(() => { c.style.transition = 'none'; place(c, role); void c.offsetWidth; c.style.transition = ''; c.style.opacity = 1; }, 320);
    } else place(c, role);
  });
  counter.textContent = `${String(cur + 1).padStart(2, '0')} / 05`;
  dots.forEach((d, k) => { d.style.width = k === cur ? ACT.w : OFF.w; d.style.backgroundColor = k === cur ? ACT.bg : OFF.bg; d.style.borderRadius = '999px'; });
}
dots.forEach((d, k) => { d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Event ' + (k + 1)); d.addEventListener('click', () => { go(k); restart(); }); });
CARDS.forEach((c, n) => c.addEventListener('click', () => { if (n !== cur) { go(n); restart(); } }));
click(byName('Next', S.culture)[0], () => { go(cur + 1); restart(); }, 'Next event'); click(byName('Previous', S.culture)[0], () => { go(cur - 1); restart(); }, 'Previous event');
const car = byName('Card Carousel')[0]; car.tabIndex = 0; car.setAttribute('aria-roledescription', 'carousel'); car.setAttribute('aria-label', 'Team events');
car.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
let sx = null; car.addEventListener('pointerdown', e => sx = e.clientX);
addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) { go(cur + (e.clientX < sx ? 1 : -1)); restart(); } sx = null; });
function restart() { clearInterval(auto); if (!reduce) auto = setInterval(() => go(cur + 1), 5500); }
car.addEventListener('pointerenter', () => clearInterval(auto)); car.addEventListener('pointerleave', restart);
go(0); restart();

/* newsletter: real input + thanks message */
const ph = byName('Placeholder Text')[0], inp = document.createElement('input');
inp.type = 'email'; inp.placeholder = 'Enter Your Email'; inp.setAttribute('aria-label', 'Email'); ph.replaceWith(inp);
const sub = byName('Subscribe Button')[0], form = byName('Form')[0];
click(sub, () => { if (!inp.checkValidity() || !inp.value) { inp.focus(); inp.reportValidity(); return; }
  let ok = $('#cg-ok'); if (!ok) { ok = document.createElement('div'); ok.id = 'cg-ok'; ok.setAttribute('role', 'status'); form.append(ok); }
  ok.textContent = "Thanks, you're subscribed."; inp.value = ''; });
inp.addEventListener('keydown', e => e.key === 'Enter' && sub.click());

/* footer links */
const fmap = { 'Home': S.hero, 'About Us': S.about, 'Contact Us': S.cta, 'Our Team': S.culture, 'Services': S.services, 'Web Development': S.services, 'Digital Marketing': S.services, 'Back Office Support': S.services, 'Image/Video Editing': S.services, 'SEO': S.services };
$$('div', byName('Footer Top')[0]).forEach(d => { const t = d.textContent.trim(); if (d.children.length === 0 && fmap[t] && d.dataset.pencilName !== 'Heading') { d.setAttribute('role', 'link'); d.tabIndex = 0; d.addEventListener('click', () => goto(fmap[t])); } });
['Facebook', 'LinkedIn', 'Instagram', 'YouTube'].forEach(n => { const e = byName(n)[0]; if (e) { e.setAttribute('role', 'link'); e.setAttribute('aria-label', n); e.tabIndex = 0; } });
[['Hero Team Image', 'Care Guide team'], ['About Image', 'Care Guide team at work'], ['CEO Portrait', 'Nusrat Shova, CEO & Founder']].forEach(([n, a]) => { const e = byName(n)[0]; if (e) { e.setAttribute('role', 'img'); e.setAttribute('aria-label', a); } });
})();
