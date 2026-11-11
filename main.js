// Menu card: open/close with the burger, close on link click, Escape, or click outside.
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');

function setMenu(open) {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
});

// ---------------- motion ----------------
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Headline: wrap each word in a span so words can settle in one by one.
const headline = document.querySelector('[data-split]');
if (headline) {
  let i = 0;
  const split = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.style.setProperty('--i', i++);
          w.textContent = part;
          frag.append(w);
        });
        child.replaceWith(frag);
      } else {
        split(child);
      }
    });
  };
  split(headline);

  // Words near the cursor get heavier, like a magnifier made of type weight.
  if (!calm && finePointer) {
    const words = [...headline.querySelectorAll('.w')];
    headline.addEventListener('pointermove', (e) => {
      words.forEach((w) => {
        const r = w.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const pull = Math.max(0, 1 - d / 170);
        w.style.fontWeight = pull > 0 ? Math.round(560 + pull * 240) : '';
      });
    });
    headline.addEventListener('pointerleave', () => words.forEach((w) => { w.style.fontWeight = ''; }));
  }
}

// Logo letters get their own spans so they can hop in a wave on hover.
const logo = document.querySelector('.logo');
if (logo && logo.firstChild && logo.firstChild.nodeType === Node.TEXT_NODE) {
  const frag = document.createDocumentFragment();
  [...logo.firstChild.textContent].forEach((ch, n) => {
    const s = document.createElement('span');
    s.className = 'l'; s.style.setProperty('--i', n); s.textContent = ch;
    frag.append(s);
  });
  logo.firstChild.replaceWith(frag);
}

if (!calm) {
  // Magnetic buttons: drift a few pixels toward the cursor.
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.25}px ${(e.clientY - (r.top + r.height / 2)) * 0.35}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  // Project names "decode" from random characters when their card scrolls in.
  const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/<>{}_';
  const decode = (el) => {
    const final = el.textContent;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 700);
      const done = Math.floor(t * final.length);
      el.textContent = final.slice(0, done) + [...final.slice(done)].map((c) => (c === '.' || c === '/' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (t < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  };

  // Scroll reveal for work cards and group counters. Moves elements only; text is never hidden.
  const targets = document.querySelectorAll('.item, .group');
  if ('IntersectionObserver' in window && targets.length) {
    document.querySelectorAll('.grid').forEach((g) => g.querySelectorAll('.item').forEach((el, n) => el.style.setProperty('--i', n % 3)));
    targets.forEach((el) => el.classList.add('pre'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.remove('pre');
        const mark = en.target.querySelector('.mark b');
        if (mark) setTimeout(() => decode(mark), (parseInt(en.target.style.getPropertyValue('--i'), 10) || 0) * 90);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    targets.forEach((el) => io.observe(el));
  }

  // Cards tilt a little toward the cursor and light up under it.
  if (finePointer) {
    document.querySelectorAll('.item').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.setProperty('--ry', `${(x - 0.5) * 6}deg`);
        card.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  // Ticker: duplicate the words for a seamless loop, and lean it with scroll speed.
  const track = document.querySelector('.ticker-track');
  if (track) {
    track.append(...[...track.children].map((n) => n.cloneNode(true)));
    let lastY = scrollY, skew = 0, ticking = false;
    const decay = () => {
      skew *= 0.88;
      track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
      if (Math.abs(skew) > 0.05) requestAnimationFrame(decay); else { track.style.setProperty('--skew', '0deg'); ticking = false; }
    };
    addEventListener('scroll', () => {
      const dy = scrollY - lastY; lastY = scrollY;
      skew = Math.max(-10, Math.min(10, skew + dy * -0.08));
      if (!ticking) { ticking = true; requestAnimationFrame(decay); }
    }, { passive: true });
  }
}
