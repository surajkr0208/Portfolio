// ============================================================
//  PORTFOLIO APP JS — Suraj Kumar Mahto
//  Handles: animations, data loading, interactions, particles
// ============================================================

import { db } from './firebase-config.js';
import { collection, getDocs, doc, onSnapshot, query, orderBy, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Default data (used when Firebase is not yet configured) ──
export const DEFAULTS = {
  skills: [
    { id:'py',  name:'Python',      icon:'fab fa-python',      color:'#3776AB', level:35, order:1 },
    { id:'js',  name:'JavaScript',  icon:'fab fa-js-square',   color:'#F7DF1E', level:40, order:2 },
    { id:'html',name:'HTML',        icon:'fab fa-html5',       color:'#E34F26', level:60, order:3 },
    { id:'css', name:'CSS',         icon:'fab fa-css3-alt',    color:'#1572B6', level:55, order:4 },
    { id:'fk',  name:'Flask',       icon:'fas fa-flask',       color:'#A855F7', level:35, order:5 },
    { id:'git', name:'Git',         icon:'fab fa-git-alt',     color:'#F05032', level:45, order:6 },
    { id:'gh',  name:'GitHub',      icon:'fab fa-github',      color:'#8B949E', level:45, order:7 },
    { id:'sql', name:'SQL',         icon:'fas fa-database',    color:'#06B6D4', level:35, order:8 },
    { id:'java',name:'Java',        icon:'fab fa-java',        color:'#F59E0B', level:30, order:9 },
    { id:'cpp', name:'C++',         icon:'fas fa-code',        color:'#10B981', level:30, order:10 },
  ],
  projects: [
    {
      id:'blog', title:'Personal Blog Site', icon:'📝',
      color:'#7C3AED',
      description:'A responsive blogging web application built with Flask that allows users to create, edit, and manage blog posts easily. Uses SQLite for database management with a clean UI.',
      tech:['Python','Flask','SQLite','HTML','CSS','JavaScript'],
      github:'https://github.com/surajkr0208/Personal-Blog-Site', live:'', order:1
    },
    {
      id:'quiz', title:'Online Quiz Platform', icon:'🧠',
      color:'#EC4899',
      description:'An interactive quiz application where users can attempt quizzes and view scores instantly. Built with Flask and SQLite for the backend, responsive frontend with HTML/CSS/JS.',
      tech:['Python','Flask','SQLite','HTML','CSS','JavaScript'],
      github:'https://github.com/surajkr0208/Online-Quiz-Platform', live:'', order:2
    },
    {
      id:'cal', title:'Calendar & Reminder App', icon:'📅',
      color:'#F59E0B',
      description:'A web-based calendar and reminder app that helps users organise tasks and manage reminders. Integrates Python, SQLite, and JSON to store and manage event data.',
      tech:['Python','Flask','SQLite','JSON','HTML','CSS'],
      github:'https://github.com/surajkr0208/CalendarReminderApp', live:'', order:3
    }
  ],
  experience: [
    {
      id:'pinnacle', company:'Pinnacle Labs',
      website:'https://pinnaclelabs.tech/',
      role:'Python Development Intern',
      duration:'April 3, 2026 – May 1, 2026',
      description:'Completed 1-month virtual Python Development Internship. Developed three web applications using Flask: a Personal Blog Site, an Online Quiz Platform, and a Calendar & Reminder App. Worked with Python, HTML, CSS, JavaScript, SQLite, and JSON.',
      color:'#10B981', order:1
    }
  ],
  certificates: [
    {
      id:'pinnacle-cert',
      title:'Python Development Internship',
      issuer:'Pinnacle Labs',
      date:'May 8, 2026',
      credential:'PL/2026/APRP1/096',
      image:'assets/certificates/pinnacle-cert.jpg',
      credentialUrl:'https://pinnaclelabs.tech/verify',
      order:1
    }
  ]
};

// ── Firestore one-time loader (fallback only) ──────────────
async function loadCollection(name, fallback) {
  if (!db) return fallback;
  try {
    const snap = await getDocs(query(collection(db, name), orderBy('order','asc')));
    if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return fallback;
  } catch { return fallback; }
}

// ── Real-time Firestore listener ─────────────────────────────
// Calls callback(data[]) immediately and on every change
function subscribeCollection(name, fallback, callback) {
  if (!db) { callback(fallback); return () => {}; }
  try {
    const q = query(collection(db, name), orderBy('order', 'asc'));
    return onSnapshot(q,
      snap => callback(snap.empty ? fallback : snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      _err => callback(fallback)
    );
  } catch { callback(fallback); return () => {}; }
}

// ────────────────────────────────────────────────────────────
//  RENDERERS
// ────────────────────────────────────────────────────────────
function renderSkills(skills) {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  // SVG circle radius=34  =>  circumference = 2π×34 ≈ 213.6
  const C = 213.6;

  grid.innerHTML = skills.map((s, i) => `
    <div class="skill-card rev-u" style="--sc:${s.color}; transition-delay:${i*0.07}s">
      <div class="skill-ring">
        <svg viewBox="0 0 82 82" width="82" height="82">
          <circle class="ring-bg"   cx="41" cy="41" r="34"/>
          <circle class="ring-fill" cx="41" cy="41" r="34"
            stroke="${s.color}"
            data-offset="${C - C * (s.level / 100)}"
            style="stroke-dashoffset:${C}"/>
        </svg>
        <div class="skill-ico"><i class="${s.icon}" style="color:${s.color}"></i></div>
      </div>
      <div class="skill-name">${s.name}</div>
      <div class="skill-lvl">Beginner · ${s.level}%</div>
    </div>`
  ).join('');

  animateRings();
  setupReveal();
}

function animateRings() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.ring-fill').forEach(r => {
          r.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)';
          r.style.strokeDashoffset = r.dataset.offset;
        });
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.skill-card').forEach(c => obs.observe(c));
}

const GRADIENTS = {
  '#7C3AED': 'linear-gradient(135deg,#7C3AED,#EC4899)',
  '#EC4899': 'linear-gradient(135deg,#EC4899,#F59E0B)',
  '#F59E0B': 'linear-gradient(135deg,#F59E0B,#06B6D4)',
};

// Language colour map (same as GitHub)
const LANG_COLORS = {
  'JavaScript':'#F1E05A','TypeScript':'#3178C6','Python':'#3572A5','Java':'#B07219',
  'HTML':'#E34C26','CSS':'#563D7C','C++':'#F34B7D','C':'#555555','C#':'#178600',
  'PHP':'#4F5D95','Ruby':'#701516','Go':'#00ADD8','Rust':'#DEA584','Swift':'#F05138',
  'Kotlin':'#A97BFF','Dart':'#00B4AB','Shell':'#89E051','Vue':'#41B883','Svelte':'#FF3E00',
  'Jupyter Notebook':'#DA5B0B'
};

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  grid.innerHTML = projects.map((p, i) => `
    <div class="proj-card rev-u${p.fromGitHub?' gh-card':''}" style="--cg:${GRADIENTS[p.color]||'var(--gradient)'}; transition-delay:${i*0.12}s">
      <div class="proj-head">
        <div class="proj-icon">${p.icon || '💻'}</div>
        <div class="proj-head-right">
          ${p.fromGitHub ? `<span class="gh-badge"><i class="fab fa-github"></i> GitHub</span>` : ''}
          <div class="proj-links">
            ${p.github ? `<a href="${p.github}" target="_blank" class="proj-link" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
            ${p.live   ? `<a href="${p.live}"   target="_blank" class="proj-link" title="Live Demo"><i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        </div>
      </div>
      <div class="proj-body">
        <h3 class="proj-title">${p.title}</h3>
        <p class="proj-desc">${p.description}</p>
        <div class="proj-tech">${(p.tech||[]).map(t => `<span class="tech-tag"${LANG_COLORS[t]?` style="border-color:${LANG_COLORS[t]}33;color:${LANG_COLORS[t]}"`:''}>${t}</span>`).join('')}</div>
        ${p.fromGitHub ? `
        <div class="gh-meta">
          ${p.stars ? `<span><i class="fas fa-star"></i> ${p.stars}</span>` : ''}
          ${p.forks ? `<span><i class="fas fa-code-branch"></i> ${p.forks}</span>` : ''}
          ${p.language ? `<span><span class="lang-dot" style="background:${LANG_COLORS[p.language]||'var(--primary)'}"></span>${p.language}</span>` : ''}
          <span><i class="fas fa-clock"></i> ${p.updated}</span>
        </div>` : ''}
      </div>
    </div>`
  ).join('');
  setupTilt();
  setupReveal();
}

function renderExperience(exp) {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  tl.innerHTML = exp.map((e, i) => `
    <div class="tl-item ${i%2===0?'rev-l':'rev-r'}">
      <div class="tl-dot" style="background:${e.color||'var(--primary)'};box-shadow:0 0 20px ${e.color||'var(--primary)'}55"></div>
      <div class="tl-content">
        <div class="tl-co"><a href="${e.website||'#'}" target="_blank">${e.company}</a></div>
        <div class="tl-role">${e.role}</div>
        <div class="tl-dur"><i class="fas fa-calendar-alt"></i> ${e.duration}</div>
        <p class="tl-desc">${e.description}</p>
      </div>
    </div>`
  ).join('');
  setupReveal();
}

function renderCerts(certs) {
  const grid = document.getElementById('certsGrid');
  if (!grid) return;
  grid.innerHTML = certs.map((c, i) => `
    <div class="cert-card rev-u" style="transition-delay:${i*0.12}s"
         onclick="openCertModal('${c.image}','${c.title}','${c.issuer} · ${c.date}${c.credential?' · ID: '+c.credential:''}')">
      <div class="cert-img-wrap">
        <img src="${c.image}" alt="${c.title}"
             onerror="this.parentElement.style.background='var(--bg-3)';this.style.opacity=0"/>
        <div class="cert-overlay"><div class="cert-overlay-ico"><i class="fas fa-expand-alt"></i></div></div>
      </div>
      <div class="cert-info">
        <div class="cert-title">${c.title}</div>
        <div class="cert-issuer">${c.issuer}</div>
        <div class="cert-date"><i class="fas fa-calendar"></i> ${c.date}</div>
        ${c.credential ? `<div class="cert-id">ID: ${c.credential}</div>` : ''}
      </div>
    </div>`
  ).join('');
  setupReveal();
}

// ────────────────────────────────────────────────────────────
//  ANIMATIONS
// ────────────────────────────────────────────────────────────
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.rev-l,.rev-r,.rev-u').forEach(el => obs.observe(el));
}

function setupTilt() {
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform = `perspective(1000px) rotateX(${-y*7}deg) rotateY(${x*7}deg) translateZ(10px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}

function animateCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target, target = +el.dataset.target, dur = 1400;
        const step = target / (dur / 16);
        let n = 0;
        const t = setInterval(() => {
          n = Math.min(n + step, target);
          el.textContent = Math.floor(n);
          if (n >= target) clearInterval(t);
        }, 16);
        obs.unobserve(el);
      }
    });
  }, { threshold: .5 });
  document.querySelectorAll('[data-target]').forEach(el => obs.observe(el));
}

function initParticles() {
  if (typeof tsParticles === 'undefined') return;
  tsParticles.load('particles-js', {
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number:  { value: 55, density: { enable: true, area: 900 } },
      color:   { value: ['#7C3AED','#EC4899','#F59E0B','#06B6D4'] },
      shape:   { type: 'circle' },
      opacity: { value:{min:.1,max:.4}, animation:{enable:true,speed:1,minimumValue:.1} },
      size:    { value:{min:1,max:3},   animation:{enable:true,speed:2,minimumValue:.5} },
      links:   { enable:true,distance:150,color:'#7C3AED',opacity:.12,width:1 },
      move:    { enable:true,speed:.7,direction:'none',random:true,straight:false,outModes:{default:'bounce'} }
    },
    interactivity: {
      events: { onHover:{enable:true,mode:'grab'}, onClick:{enable:true,mode:'push'} },
      modes:  { grab:{distance:140,links:{opacity:.4}}, push:{quantity:3} }
    },
    detectRetina: true
  });
}

function initTypewriter() {
  const el = document.getElementById('tw');
  if (!el) return;
  const words = ['Full Stack Developer','Python Developer','AI & ML Enthusiast','Open Source Contributor','Problem Solver'];
  let wi = 0, ci = 0, del = false;
  function tick() {
    const w = words[wi];
    if (del) { el.textContent = w.slice(0, --ci); }
    else     { el.textContent = w.slice(0, ++ci); }
    let ms = del ? 50 : 95;
    if (!del && ci === w.length)    { ms = 2000; del = true; }
    else if (del && ci === 0)       { del = false; wi = (wi+1) % words.length; ms = 350; }
    setTimeout(tick, ms);
  }
  tick();
}

function initCursor() {
  const cur = document.getElementById('cursor');
  const fol = document.getElementById('cursorF');
  if (!cur || !fol) return;
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  });
  (function anim() {
    fx += (mx - fx) * .14; fy += (my - fy) * .14;
    fol.style.left = fx + 'px'; fol.style.top = fy + 'px';
    requestAnimationFrame(anim);
  })();
  document.querySelectorAll('a,button,.skill-card,.proj-card,.cert-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cur.classList.add('hov'); fol.classList.add('hov'); });
    el.addEventListener('mouseleave', () => { cur.classList.remove('hov'); fol.classList.remove('hov'); });
  });
}

function initNavbar() {
  const nav  = document.getElementById('navbar');
  const ham  = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 50);
    highlightNav();
  });
  ham?.addEventListener('click', () => {
    ham.classList.toggle('on');
    links.classList.toggle('open');
  });
  document.querySelectorAll('.nav-link').forEach(a =>
    a.addEventListener('click', () => { ham?.classList.remove('on'); links?.classList.remove('open'); })
  );
}

function highlightNav() {
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(s => {
    const r = s.getBoundingClientRect();
    if (r.top <= 100 && r.bottom >= 100) {
      document.querySelectorAll('.nav-link').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + s.id)
      );
    }
  });
}

// ── Loader & Hero entrance ────────────────────────────────────
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    loader.classList.add('out');
    document.body.style.overflow = '';
    animateHeroIn();
    setTimeout(initParticles, 300);
  }, 1700);
}

function animateHeroIn() {
  const items = ['.hero-badge','.hero-name','.hero-typing','.hero-bio','.hero-btns','.hero-socials'];
  items.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.cssText = 'opacity:0;transform:translateY(28px)';
    setTimeout(() => {
      el.style.transition = 'opacity .65s ease, transform .65s ease';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }, i * 140);
  });
  const vis = document.querySelector('.hero-visual');
  if (vis) {
    vis.style.cssText = 'opacity:0;transform:scale(.85)';
    setTimeout(() => {
      vis.style.transition = 'opacity .8s ease, transform .8s ease';
      vis.style.opacity = '1'; vis.style.transform = 'scale(1)';
    }, 500);
  }
}

// ── Toast notification ────────────────────────────────────────
window.showToast = function(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
};

// ── Certificate modal ─────────────────────────────────────────
window.openCertModal = function(img, title, sub) {
  document.getElementById('modalImg').src   = img;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalSub').textContent   = sub;
  document.getElementById('certModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeCertModal = function() {
  document.getElementById('certModal').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Contact form ──────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  const btn  = document.getElementById('sendBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled  = true;

    const name    = document.getElementById('cName').value;
    const email   = document.getElementById('cEmail').value;
    const subject = document.getElementById('cSubject').value || 'Portfolio Contact';
    const msg     = document.getElementById('cMsg').value;

    // Try Firestore first, fall back to mailto
    if (db) {
      try {
        await addDoc(collection(db, 'contacts'), { 
          name, 
          email, 
          subject, 
          msg, 
          ts: serverTimestamp() 
        });
        window.showToast('✅ Message sent! I\'ll reply soon.');
        form.reset();
        btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3000);
        return;
      } catch (err) {
        console.error('[Portfolio] Contact form Firestore error:', err);
        window.showToast('Database error. Falling back to email...', 'err');
      }
    }

    // Fallback: mailto
    window.location.href =
      `mailto:surajkumarmahto7033@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`)}`;
    btn.innerHTML = orig; btn.disabled = false;
  });
}

// ── Keyboard: close modal on Escape ──────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCertModal();
});

// ── Admin button: show "Logged in" indicator if authenticated ─
async function checkAdminStatus() {
  const { auth } = await import('./firebase-config.js');
  if (!auth) return;
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  onAuthStateChanged(auth, user => {
    const btn = document.getElementById('adminBtn');
    if (btn && user) {
      btn.href  = 'dashboard.html';
      btn.title = 'Admin Dashboard';
      btn.innerHTML = '<i class="fas fa-gauge-high"></i>';
      btn.style.borderColor = 'var(--green)';
      btn.style.color       = 'var(--green)';
    }
  });
}

// ── Real-time profile sync from Firestore → DOM ──────────
// Uses onSnapshot so the homepage updates INSTANTLY whenever
// the admin saves changes — no page refresh needed.
function loadProfileData() {
  if (!db) {
    console.warn('[Portfolio] Firebase not configured — using hardcoded defaults.');
    return;
  }

  const set = (id, val) => {
    if (!val) return;
    const el = document.getElementById(id);
    if (el) el.textContent = val;
    else console.warn('[Portfolio] Element not found: #' + id);
  };

  onSnapshot(
    doc(db, 'portfolio', 'profile'),
    (snap) => {
      if (!snap.exists()) {
        console.log('[Portfolio] profile doc does not exist yet — using defaults');
        return;
      }
      const d = snap.data();
      console.log('[Portfolio] Profile loaded from Firestore:', d);

      // ── Photos (hero + about section) ──────────────────
      const src = d.photoBase64 || d.photoUrl || null;
      if (src) document.querySelectorAll('.p-img').forEach(img => img.src = src);

      // ── Hero section ───────────────────────────────────
      set('heroName', d.name);
      set('heroBio',  d.tagline);

      // ── About info cards ───────────────────────────────
      set('aboutName',     d.name);
      set('aboutLocation', d.location);
      set('aboutEmail',    d.email);

      // ── About bio paragraph ────────────────────────────
      if (d.bio) set('aboutBio', d.bio);

      // ── CV button ──────────────────────────────────────
      if (d.resume) {
        const cvBtn = document.getElementById('cvBtn');
        if (cvBtn) {
          cvBtn.href = d.resume;
          cvBtn.setAttribute('target', '_blank');
          cvBtn.removeAttribute('download');
        }
      }

      // ── Contact email link ─────────────────────────────
      if (d.email) {
        const link = document.getElementById('contactEmailLink');
        if (link) link.href = `mailto:${d.email}`;
        set('contactEmailVal', d.email);
      }
    },
    (err) => console.error('[Portfolio] Firestore profile error:', err)
  );
}

// ────────────────────────────────────────────────────────────
//  MAIN INIT
// ────────────────────────────────────────────────────────────
// ── GitHub API Integration ────────────────────────────────────
const GITHUB_USER = 'surajkr0208';

async function fetchGitHubRepos() {
  try {
    const res  = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=30`);
    if (!res.ok) return [];
    const repos = await res.json();
    return repos
      .filter(r => r.description && !r.fork)   // only repos with a description, skip forks
      .slice(0, 12)                              // max 12
      .map(r => ({
        id:          'gh-' + r.id,
        title:       r.name.replace(/-/g,' ').replace(/_/g,' '),
        icon:        '🐙',
        color:       '#7C3AED',
        description: r.description,
        tech:        r.topics?.length ? r.topics : (r.language ? [r.language] : []),
        language:    r.language,
        github:      r.html_url,
        live:        r.homepage || '',
        stars:       r.stargazers_count,
        forks:       r.forks_count,
        updated:     timeAgo(r.pushed_at),
        fromGitHub:  true,
        order:       999
      }));
  } catch { return []; }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const d    = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d/7)}w ago`;
  if (d < 365)return `${Math.floor(d/30)}mo ago`;
  return `${Math.floor(d/365)}y ago`;
}

// ── Live state shared across listeners ───────────────────────
const _live = { skills: null, projects: null, experience: null, certs: null, ghRepos: [] };

function _rerender(changed) {
  if (changed === 'skills'     && _live.skills)     renderSkills(_live.skills);
  if (changed === 'experience' && _live.experience) renderExperience(_live.experience);
  if (changed === 'certs'      && _live.certs)      renderCerts(_live.certs);
  if ((changed === 'projects' || changed === 'ghRepos') &&
      _live.projects !== null && _live.ghRepos !== null) {
    const adminUrls   = new Set(_live.projects.map(p => p.github).filter(Boolean).map(u => u.toLowerCase().trim()));
    const adminTitles = new Set(_live.projects.map(p => p.title?.toLowerCase().replace(/[\s_-]+/g, '')));
    const unique      = _live.ghRepos.filter(r =>
      !adminUrls.has(r.github?.toLowerCase().trim()) &&
      !adminTitles.has(r.title?.toLowerCase().replace(/[\s_-]+/g, ''))
    );
    renderProjects([..._live.projects, ...unique]);
    updateGitHubStats(unique, _live.projects.length);
  }
}

async function init() {
  initLoader();
  initNavbar();
  initTypewriter();
  initCursor();
  animateCounters();
  initContactForm();
  checkAdminStatus();
  setupReveal();
  loadProfileData();

  // ── Real-time Firestore listeners ────────────────────────
  subscribeCollection('skills', DEFAULTS.skills, data => {
    _live.skills = data; _rerender('skills');
  });
  subscribeCollection('projects', DEFAULTS.projects, data => {
    _live.projects = data; _rerender('projects');
  });
  subscribeCollection('experience', DEFAULTS.experience, data => {
    _live.experience = data; _rerender('experience');
  });
  subscribeCollection('certificates', DEFAULTS.certificates, data => {
    _live.certs = data; _rerender('certs');
  });

  // ── GitHub: fetch now + poll every 5 minutes ─────────────
  async function refreshGitHub() {
    const repos = await fetchGitHubRepos();
    _live.ghRepos = repos;
    _rerender('ghRepos');
  }
  refreshGitHub();
  setInterval(refreshGitHub, 5 * 60 * 1000); // every 5 min
}

function animateCount(el, target) {
  if (!el) return;
  const dur = 1200, step = target / (dur / 16);
  let n = 0;
  const t = setInterval(() => {
    n = Math.min(n + step, target);
    el.textContent = Math.floor(n);
    if (n >= target) clearInterval(t);
  }, 16);
}

function updateGitHubStats(ghRepos, adminProjectCount = 0) {
  const totalProjects = adminProjectCount + ghRepos.length;
  const totalStars    = ghRepos.reduce((s, r) => s + (r.stars || 0), 0);

  // Projects section strip
  const repoCount = document.getElementById('ghRepoCount');
  const starCount = document.getElementById('ghStarCount');
  if (repoCount) repoCount.textContent = ghRepos.length;
  if (starCount) starCount.textContent = totalStars;

  // About section stat cards
  const aboutProjects = document.getElementById('aboutStatProjects');
  const aboutStars    = document.getElementById('aboutStatStars');
  animateCount(aboutProjects, totalProjects);
  animateCount(aboutStars, totalStars);
}

document.addEventListener('DOMContentLoaded', init);

// ── Theme Toggle (Dark / Light) ────────────────────────────
(function() {
  const html   = document.documentElement;
  const saved  = localStorage.getItem('theme') || 'dark';
  if (saved === 'light') html.setAttribute('data-theme', 'light');

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = html.getAttribute('data-theme') === 'light';
      if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });
  }
})();
