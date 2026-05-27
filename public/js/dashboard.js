// ============================================================
//  ADMIN DASHBOARD JS — Suraj Kumar Mahto
//  Images stored as base64 in Firestore (FREE — no Storage needed)
//  Document Vault uses Supabase Storage (free tier, full CORS)
// ============================================================

import { requireAuth, logout, login } from './auth.js';
import { db } from './firebase-config.js';
import {
  collection, doc, getDocs, setDoc, deleteDoc, addDoc,
  query, orderBy, getDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { DEFAULTS } from './app.js';

// ── Auth guard ────────────────────────────────────────────
let currentUser;
try {
  currentUser = await requireAuth('login.html');
} catch { /* already redirected */ }

// ── Logout ────────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', () => logout());

// ── Auto-Logout Timer (10 minutes) ────────────────────────
let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    alert('Session expired due to inactivity. Please log in again.');
    logout();
  }, 10 * 60 * 1000); // 10 minutes
}
['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => 
  document.addEventListener(evt, resetInactivityTimer)
);
resetInactivityTimer();

// ── Toast ────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Navigation ────────────────────────────────────────────
window.nav = async function(page) {
  if (page === 'messages') {
    const pass = prompt('Security Check: Enter your Admin Password to view Private Messages:');
    if (!pass) return;
    try {
      await login(currentUser.email, pass);
    } catch(e) {
      alert('Incorrect password. Access denied.');
      return;
    }
  }

  // Auto-close sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sbOverlay')?.classList.remove('open');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector(`.sb-link[data-page="${page}"]`)?.classList.add('active');
  const titles = {
    overview:'Overview', profile:'Edit Profile',
    skills:'Skills & Technologies', projects:'Projects',
    experience:'Work Experience', certificates:'Certificates', socials:'Social Links',
    messages:'Messages'
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;
  document.getElementById('topbarSave').style.display = ['profile','socials'].includes(page) ? 'flex' : 'none';
  loadPage(page);
};

async function loadPage(page) {
  switch(page) {
    case 'overview':     return loadOverview();
    case 'profile':      return loadProfile();
    case 'skills':       return loadSkills();
    case 'projects':     return loadProjects();
    case 'experience':   return loadExperience();
    case 'certificates': return loadCertificates();
    case 'socials':      return loadSocials();
    case 'messages':     return loadMessages();
  }
}

// ── Helpers ───────────────────────────────────────────────
function safeGet(collName, def = []) {
  if (!db) return Promise.resolve(def);
  return getDocs(query(collection(db, collName), orderBy('order', 'asc')))
    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
    .catch(() => def);
}

function needsDb() {
  if (!db) { toast('Firebase not configured. See SETUP.md', 'err'); return true; }
  return false;
}

// ── Image compression using Canvas API (FREE, no upload service) ─────
// Compresses images client-side before storing as base64 in Firestore
async function compressImage(file, maxWidth = 600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(url);
      // Warn if still large (Firestore limit: 1MB per document)
      const sizeKB = Math.round(base64.length * 0.75 / 1024);
      if (sizeKB > 900) {
        reject(new Error(`Image is ${sizeKB}KB after compression (max ~900KB). Please use a smaller/lower-resolution image.`));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => reject(new Error('Could not read image file'));
    img.src = url;
  });
}

// ════════════════════════════════════════════════════════════
//  OVERVIEW — real-time listeners for all stat boxes
// ════════════════════════════════════════════════════════════
const _dbSet = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

function loadOverview() {
  if (!db) return;

  sub('skills',       DEFAULTS.skills,       n    => _dbSet('statsSkills', n));
  sub('certificates', DEFAULTS.certificates, n    => _dbSet('statsCerts',  n));
  sub('experience',   DEFAULTS.experience,   n    => _dbSet('statsExp',    n));
  // For projects: pass full docs so GitHub dedup can work
  subDocs('projects', DEFAULTS.projects, docs => {
    _cachedAdminDocs = docs;
    _dbSet('statsProjects', docs.length); // base count; refined after GitHub fetch
    _refreshGhStats();
  });

  // GitHub stats — fetch now + every 5 min
  _refreshGhStats();
  setInterval(_refreshGhStats, 5 * 60 * 1000);
}

// Simple count-only subscriber
function sub(col, fallback, cb) {
  onSnapshot(query(collection(db, col), orderBy('order','asc')),
    snap => cb(snap.empty ? fallback.length : snap.docs.length),
    ()   => cb(fallback.length)
  );
}
// Full-doc subscriber
function subDocs(col, fallback, cb) {
  onSnapshot(query(collection(db, col), orderBy('order','asc')),
    snap => cb(snap.empty ? fallback : snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    ()   => cb(fallback)
  );
}

let _cachedAdminDocs = DEFAULTS.projects;

async function _refreshGhStats() {
  try {
    const res = await fetch(`https://api.github.com/users/surajkr0208/repos?per_page=100&t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const repos = await res.json();

    // Build dedup sets from admin projects (same logic as public portfolio)
    const adminUrls   = new Set(_cachedAdminDocs.map(p => p.github).filter(Boolean).map(u => u.toLowerCase().trim()));
    const adminTitles = new Set(_cachedAdminDocs.map(p => p.title?.toLowerCase().replace(/[\s_-]+/g, '')));

    const repoCount  = repos.filter(r => !r.fork).length;
    const starCount  = repos.reduce((s, r) => s + r.stargazers_count, 0);
    // Only count GitHub repos NOT already in the admin panel
    const uniqueGh   = repos.filter(r =>
      r.description && !r.fork &&
      !adminUrls.has(r.html_url?.toLowerCase().trim()) &&
      !adminTitles.has(r.name?.replace(/[-_]+/g,' ').toLowerCase().replace(/[\s_-]+/g,''))
    ).length;

    _dbSet('statsGhRepos', repoCount);
    _dbSet('statsGhStars', starCount);
    _dbSet('dbGhRepos',    repoCount);
    _dbSet('dbGhStars',    starCount);
    // Total unique projects = admin + truly new GitHub repos
    _dbSet('statsProjects', _cachedAdminDocs.length + uniqueGh);
  } catch { /* fail silently */ }
}


// ════════════════════════════════════════════════════════════
//  PROFILE  — photo stored as compressed base64 in Firestore
// ════════════════════════════════════════════════════════════
async function loadProfile() {
  if (!db) { setProfileDefaults(); return; }
  try {
    const snap = await getDoc(doc(db, 'portfolio', 'profile'));
    const d = snap.exists() ? snap.data() : {};
    document.getElementById('pName').value      = d.name      || 'Suraj Kumar Mahto';
    document.getElementById('pTitle').value     = d.title     || 'B.Tech CSE (AI & ML) | Aspiring Full Stack Developer';
    document.getElementById('pTagline').value   = d.tagline   || 'Building modern web applications and exploring the power of AI & Machine Learning.';
    document.getElementById('pBio').value       = d.bio       || '';
    document.getElementById('pLocation').value  = d.location  || 'Jharkhand, India';
    document.getElementById('pEmail').value     = d.email     || 'surajkumarmahto7033@gmail.com';
    document.getElementById('pResume').value    = d.resume    || '';
    document.getElementById('pAvailable').value = d.available || 'Internships, Freelance, Open Source';
    // Load stored photo (base64 or URL)
    if (d.photoBase64) {
      document.getElementById('profilePhotoPreview').src = d.photoBase64;
    } else if (d.photoUrl) {
      document.getElementById('profilePhotoPreview').src = d.photoUrl;
    }
  } catch { setProfileDefaults(); }
}

function setProfileDefaults() {
  document.getElementById('pName').value     = 'Suraj Kumar Mahto';
  document.getElementById('pTitle').value    = 'B.Tech CSE (AI & ML) | Aspiring Full Stack Developer';
  document.getElementById('pLocation').value = 'Jharkhand, India';
  document.getElementById('pEmail').value    = 'surajkumarmahto7033@gmail.com';
}

window.saveProfile = async function() {
  if (needsDb()) return;
  const btn = document.querySelector('.sec-card-head .btn-primary');
  const origTxt = btn?.innerHTML;
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; btn.disabled = true; }

  const data = {
    name:      document.getElementById('pName').value,
    title:     document.getElementById('pTitle').value,
    tagline:   document.getElementById('pTagline').value,
    bio:       document.getElementById('pBio').value,
    location:  document.getElementById('pLocation').value,
    email:     document.getElementById('pEmail').value,
    resume:    document.getElementById('pResume').value,
    available: document.getElementById('pAvailable').value,
  };

  // Compress photo → base64 → store in Firestore (completely FREE)
  const file = document.getElementById('profilePhotoInput').files[0];
  if (file) {
    try {
      toast('Compressing photo…');
      const base64 = await compressImage(file, 500, 0.85);
      data.photoBase64 = base64;
      document.getElementById('profilePhotoPreview').src = base64;
    } catch(e) {
      toast('⚠️ ' + e.message, 'err');
      if (btn) { btn.innerHTML = origTxt; btn.disabled = false; }
      return;
    }
  }

  try {
    await setDoc(doc(db, 'portfolio', 'profile'), data, { merge: true });
    toast('✅ Profile saved!');
  } catch(e) { toast('Error: ' + e.message, 'err'); }
  finally {
    if (btn) { btn.innerHTML = origTxt; btn.disabled = false; }
  }
};

window.previewProfilePhoto = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => document.getElementById('profilePhotoPreview').src = e.target.result;
  reader.readAsDataURL(file);
};

// ════════════════════════════════════════════════════════════
//  SKILLS
// ════════════════════════════════════════════════════════════
let skillsCache = [];

async function loadSkills() {
  skillsCache = await safeGet('skills', []);
  if (!skillsCache.length) skillsCache = DEFAULTS.skills;
  renderSkillsList();
}

function renderSkillsList() {
  const list = document.getElementById('skillsList');
  if (!skillsCache.length) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:.85rem">No skills yet. Add your first skill!</p>';
    return;
  }
  list.innerHTML = skillsCache.map(s => `
    <div class="skill-item">
      <div class="skill-item-info">
        <i class="${s.icon}" style="color:${s.color};font-size:1.3rem;flex-shrink:0"></i>
        <div style="flex:1;min-width:0">
          <div class="skill-item-name">${s.name}</div>
          <div class="skill-item-lvl">${s.level}%</div>
          <div class="skill-item-bar"><div class="skill-item-fill" style="width:${s.level}%;background:${s.color}"></div></div>
        </div>
      </div>
      <div class="skill-item-actions">
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="editSkill('${s.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteSkill('${s.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

window.openModal = function(type, id = null) {
  document.getElementById('modal-' + type).classList.add('open');
  if (type === 'skill') {
    if (id) {
      const s = skillsCache.find(x => x.id === id);
      if (!s) return;
      document.getElementById('skillModalTitle').textContent = 'Edit Skill';
      document.getElementById('skillId').value       = s.id;
      document.getElementById('skillName').value     = s.name;
      document.getElementById('skillIcon').value     = s.icon;
      document.getElementById('skillColor').value    = s.color;
      document.getElementById('skillColorHex').value = s.color;
      document.getElementById('skillLevel').value    = s.level;
      document.getElementById('skillLevelVal').textContent = s.level;
    } else {
      document.getElementById('skillModalTitle').textContent = 'Add Skill';
      document.getElementById('skillId').value = '';
      ['skillName','skillIcon','skillColorHex'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('skillColor').value = '#7C3AED';
      document.getElementById('skillLevel').value = 50;
      document.getElementById('skillLevelVal').textContent = 50;
    }
  }
  if (type === 'project') {
    if (id) {
      const p = projectsCache.find(x => x.id === id);
      if (!p) return;
      document.getElementById('projModalTitle').textContent = 'Edit Project';
      document.getElementById('projId').value     = p.id;
      document.getElementById('projTitle').value  = p.title;
      document.getElementById('projDesc').value   = p.description;
      document.getElementById('projIcon').value   = p.icon;
      document.getElementById('projColor').value  = p.color;
      document.getElementById('projGithub').value = p.github;
      document.getElementById('projLive').value   = p.live || '';
      document.getElementById('projTech').value   = (p.tech || []).join(', ');
    } else {
      document.getElementById('projModalTitle').textContent = 'Add Project';
      ['projId','projTitle','projDesc','projIcon','projGithub','projLive','projTech'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('projColor').value = '#7C3AED';
    }
  }
  if (type === 'exp') {
    if (id) {
      const e = expCache.find(x => x.id === id);
      if (!e) return;
      document.getElementById('expModalTitle').textContent = 'Edit Experience';
      document.getElementById('expId').value       = e.id;
      document.getElementById('expCompany').value  = e.company;
      document.getElementById('expRole').value     = e.role;
      document.getElementById('expDuration').value = e.duration;
      document.getElementById('expWebsite').value  = e.website || '';
      document.getElementById('expColor').value    = e.color || '#10B981';
      document.getElementById('expDesc').value     = e.description;
    } else {
      document.getElementById('expModalTitle').textContent = 'Add Experience';
      ['expId','expCompany','expRole','expDuration','expWebsite','expDesc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('expColor').value = '#10B981';
    }
  }
  if (type === 'cert') {
    if (id) {
      const c = certsCache.find(x => x.id === id);
      if (!c) return;
      document.getElementById('certModalTitle').textContent = 'Edit Certificate';
      document.getElementById('certId').value      = c.id;
      document.getElementById('certTitle').value   = c.title;
      document.getElementById('certIssuer').value  = c.issuer;
      document.getElementById('certDate').value    = c.date;
      document.getElementById('certCred').value    = c.credential || '';
      document.getElementById('certCredUrl').value = c.credentialUrl || '';
    } else {
      document.getElementById('certModalTitle').textContent = 'Add Certificate';
      ['certId','certTitle','certIssuer','certDate','certCred','certCredUrl'].forEach(id => document.getElementById(id).value = '');
      removeCertPreview();
    }
  }
};

window.closeModal = function(type) {
  document.getElementById('modal-' + type).classList.remove('open');
};

// Color picker sync
document.getElementById('skillColor')?.addEventListener('input', e => {
  document.getElementById('skillColorHex').value = e.target.value;
});
document.getElementById('skillColorHex')?.addEventListener('input', e => {
  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
    document.getElementById('skillColor').value = e.target.value;
});

window.saveSkill = async function() {
  if (needsDb()) return;
  const id    = document.getElementById('skillId').value;
  const name  = document.getElementById('skillName').value.trim();
  const icon  = document.getElementById('skillIcon').value.trim();
  const color = document.getElementById('skillColorHex').value || document.getElementById('skillColor').value;
  const level = parseInt(document.getElementById('skillLevel').value);
  if (!name) { toast('Skill name is required', 'err'); return; }
  const data = { name, icon: icon || 'fas fa-code', color: color || '#7C3AED', level, order: skillsCache.length + 1 };
  try {
    if (id) await setDoc(doc(db, 'skills', id), data);
    else    await addDoc(collection(db, 'skills'), data);
    toast('✅ Skill saved!'); closeModal('skill'); loadSkills();
  } catch(e) { toast('Error: ' + e.message, 'err'); }
};

window.editSkill   = id => openModal('skill', id);
window.deleteSkill = async function(id) {
  if (!confirm('Delete this skill?')) return;
  try { await deleteDoc(doc(db, 'skills', id)); toast('Skill deleted'); loadSkills(); }
  catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ════════════════════════════════════════════════════════════
//  PROJECTS
// ════════════════════════════════════════════════════════════
let projectsCache = [];

async function loadProjects() {
  projectsCache = await safeGet('projects', []);
  if (!projectsCache.length) projectsCache = DEFAULTS.projects;
  const list = document.getElementById('projList');

  // Render admin projects (editable)
  const adminHTML = projectsCache.length
    ? projectsCache.map(p => `
    <div class="proj-item">
      <div style="font-size:1.75rem;flex-shrink:0">${p.icon || '💻'}</div>
      <div class="proj-item-info">
        <div class="proj-item-title">${p.title}</div>
        <div class="proj-item-desc">${p.description}</div>
        <div class="proj-item-tech">${(p.tech || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <div class="proj-item-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editProject('${p.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteProject('${p.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('')
    : '<p style="color:var(--text-3);font-size:.85rem">No projects yet.</p>';

  list.innerHTML = adminHTML;

  // Fetch GitHub repos and append unique ones (read-only)
  try {
    const res = await fetch(`https://api.github.com/users/surajkr0208/repos?sort=updated&per_page=30&t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const repos = await res.json();

    // Dedup against admin projects
    const adminUrls   = new Set(projectsCache.map(p => p.github).filter(Boolean).map(u => u.toLowerCase().trim()));
    const adminTitles = new Set(projectsCache.map(p => p.title?.toLowerCase().replace(/[\s_-]+/g, '')));
    const unique = repos.filter(r =>
      r.description && !r.fork &&
      !adminUrls.has(r.html_url?.toLowerCase().trim()) &&
      !adminTitles.has(r.name?.replace(/[-_]+/g,' ').toLowerCase().replace(/[\s_-]+/g,''))
    );

    if (unique.length) {
      const divider = `<div style="display:flex;align-items:center;gap:.75rem;margin:1.25rem 0 .5rem;color:var(--text-3);font-size:.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">
        <i class="fab fa-github"></i> Auto-synced from GitHub
        <div style="flex:1;height:1px;background:var(--border)"></div>
      </div>`;
      const ghHTML = unique.map(r => `
        <div class="proj-item" style="opacity:.88">
          <div style="font-size:1.75rem;flex-shrink:0">🐙</div>
          <div class="proj-item-info">
            <div class="proj-item-title" style="display:flex;align-items:center;gap:.5rem">
              ${r.name.replace(/-/g,' ').replace(/_/g,' ')}
              <span style="font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:100px;background:rgba(139,148,158,.12);color:#8B949E;border:1px solid rgba(139,148,158,.2)">GitHub</span>
            </div>
            <div class="proj-item-desc">${r.description}</div>
            <div class="proj-item-tech">
              ${r.language ? `<span class="tag">${r.language}</span>` : ''}
              ${(r.topics||[]).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
          <div class="proj-item-actions">
            <a href="${r.html_url}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Open on GitHub"><i class="fab fa-github"></i></a>
            ${r.homepage ? `<a href="${r.homepage}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Live Demo"><i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        </div>`).join('');
      list.innerHTML += divider + ghHTML;
    }
  } catch { /* fail silently if GitHub API unreachable */ }
}


window.saveProject = async function() {
  if (needsDb()) return;
  const id    = document.getElementById('projId').value;
  const title = document.getElementById('projTitle').value.trim();
  if (!title) { toast('Title is required', 'err'); return; }
  const techRaw = document.getElementById('projTech').value;
  const data = {
    title, description: document.getElementById('projDesc').value,
    icon:   document.getElementById('projIcon').value  || '💻',
    color:  document.getElementById('projColor').value || '#7C3AED',
    github: document.getElementById('projGithub').value,
    live:   document.getElementById('projLive').value,
    tech:   techRaw.split(',').map(s => s.trim()).filter(Boolean),
    order:  projectsCache.length + 1
  };
  try {
    if (id) await setDoc(doc(db, 'projects', id), data);
    else    await addDoc(collection(db, 'projects'), data);
    toast('✅ Project saved!'); closeModal('project'); loadProjects();
  } catch(e) { toast('Error: ' + e.message, 'err'); }
};

window.RESTORE_PROJECTS = async function() {
  const DEFAULTS = [
    { title:'Personal Blog Site', description:'A responsive blogging web application built with Flask that allows users to create, edit, and manage blog posts easily. Uses SQLite for database management with a clean UI.', icon:'📝', color:'#3B82F6', github:'https://github.com/surajkr0208/Personal-Blog-Site', live:'', tech:['Python','Flask','SQLite','HTML','CSS','JavaScript'], order:1 },
    { title:'Online Quiz Platform', description:'An interactive quiz application where users can attempt quizzes and view scores instantly. Built with Flask and SQLite for the backend, responsive frontend with HTML/CSS/JS.', icon:'🧠', color:'#EC4899', github:'https://github.com/surajkr0208/Online-Quiz-Platform', live:'', tech:['Python','Flask','SQLite','HTML','CSS','JavaScript'], order:2 },
    { title:'Calendar & Reminder App', description:'A web-based calendar and reminder app that helps users organise tasks and manage reminders. Integrates Python, SQLite, and JSON to store and manage event data.', icon:'📅', color:'#8B5CF6', github:'https://github.com/surajkr0208/CalendarReminderApp', live:'', tech:['Python','Flask','SQLite','JSON','HTML','CSS'], order:3 }
  ];
  for (let p of DEFAULTS) {
    await addDoc(collection(db, 'projects'), p);
  }
  toast('Projects restored successfully!');
  setTimeout(() => location.reload(), 1000);
};

window.editProject   = id => openModal('project', id);
window.deleteProject = async function(id) {
  if (!confirm('Delete this project?')) return;
  try { await deleteDoc(doc(db, 'projects', id)); toast('Project deleted'); loadProjects(); }
  catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ════════════════════════════════════════════════════════════
//  EXPERIENCE
// ════════════════════════════════════════════════════════════
let expCache = [];

async function loadExperience() {
  expCache = await safeGet('experience', []);
  if (!expCache.length) expCache = DEFAULTS.experience;
  const list = document.getElementById('expList');
  if (!expCache.length) { list.innerHTML = '<p style="color:var(--text-3);font-size:.85rem">No experience yet.</p>'; return; }
  list.innerHTML = expCache.map(e => `
    <div class="exp-item">
      <div class="exp-item-info">
        <div class="exp-item-co">${e.company}</div>
        <div class="exp-item-role">${e.role}</div>
        <div class="exp-item-dur"><i class="fas fa-calendar-alt" style="color:var(--accent)"></i> ${e.duration}</div>
      </div>
      <div style="display:flex;gap:.35rem;flex-shrink:0">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="editExp('${e.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteExp('${e.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

window.saveExp = async function() {
  if (needsDb()) return;
  const id = document.getElementById('expId').value;
  const co = document.getElementById('expCompany').value.trim();
  if (!co) { toast('Company name required', 'err'); return; }
  const data = {
    company:     co,
    role:        document.getElementById('expRole').value,
    duration:    document.getElementById('expDuration').value,
    website:     document.getElementById('expWebsite').value,
    color:       document.getElementById('expColor').value,
    description: document.getElementById('expDesc').value,
    order: expCache.length + 1
  };
  try {
    if (id) await setDoc(doc(db, 'experience', id), data);
    else    await addDoc(collection(db, 'experience'), data);
    toast('✅ Experience saved!'); closeModal('exp'); loadExperience();
  } catch(e) { toast('Error: ' + e.message, 'err'); }
};
window.editExp   = id => openModal('exp', id);
window.deleteExp = async function(id) {
  if (!confirm('Delete?')) return;
  try { await deleteDoc(doc(db, 'experience', id)); toast('Deleted'); loadExperience(); }
  catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ════════════════════════════════════════════════════════════
//  CERTIFICATES — image stored as base64 in Firestore (FREE)
// ════════════════════════════════════════════════════════════
let certsCache  = [];
let certImgFile = null;

async function loadCertificates() {
  certsCache = await safeGet('certificates', []);
  if (!certsCache.length) certsCache = DEFAULTS.certificates;
  const list = document.getElementById('certList');
  if (!certsCache.length) { list.innerHTML = '<p style="color:var(--text-3);font-size:.85rem">No certificates yet.</p>'; return; }
  list.innerHTML = certsCache.map(c => `
    <div class="cert-item">
      <div class="cert-item-img">
        ${c.image
          ? `<img src="${c.image}" alt="${c.title}" onerror="this.style.display='none'"/>`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3)"><i class="fas fa-image" style="font-size:2rem"></i></div>`
        }
      </div>
      <div class="cert-item-body">
        <div class="cert-item-title">${c.title}</div>
        <div class="cert-item-meta">${c.issuer} · ${c.date}</div>
        <div class="cert-item-actions">
          <button class="btn btn-ghost btn-sm" onclick="editCert('${c.id}')"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCert('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('');
}

window.previewCertImg = function(input) {
  certImgFile = input.files[0];
  if (!certImgFile) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('certPreviewImg').src = e.target.result;
    document.getElementById('certPreviewWrap').style.display = 'inline-block';
  };
  reader.readAsDataURL(certImgFile);
};
window.removeCertPreview = function() {
  certImgFile = null;
  document.getElementById('certPreviewImg').src = '';
  document.getElementById('certPreviewWrap').style.display = 'none';
  document.getElementById('certImgFile').value = '';
};

window.saveCert = async function() {
  if (needsDb()) return;
  const id    = document.getElementById('certId').value;
  const title = document.getElementById('certTitle').value.trim();
  if (!title) { toast('Title required', 'err'); return; }

  const btn = document.querySelector('#modal-cert .d-modal-foot .btn-primary');
  const origTxt = btn?.innerHTML;
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; btn.disabled = true; }

  let imageData = id ? (certsCache.find(c => c.id === id) || {}).image || '' : '';

  // Compress certificate image → base64 → store in Firestore (FREE)
  if (certImgFile) {
    try {
      toast('Compressing certificate image…');
      imageData = await compressImage(certImgFile, 900, 0.85);
    } catch(e) {
      toast('⚠️ ' + e.message, 'err');
      if (btn) { btn.innerHTML = origTxt; btn.disabled = false; }
      return;
    }
  }

  const dateVal = document.getElementById('certDate').value;
  const data = {
    title, issuer: document.getElementById('certIssuer').value,
    date:  dateVal ? new Date(dateVal).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : '',
    credential:    document.getElementById('certCred').value,
    credentialUrl: document.getElementById('certCredUrl').value,
    image: imageData,
    order: certsCache.length + 1
  };

  try {
    if (id) await setDoc(doc(db, 'certificates', id), data);
    else    await addDoc(collection(db, 'certificates'), data);
    toast('✅ Certificate saved!');
    closeModal('cert'); certImgFile = null; loadCertificates();
  } catch(e) {
    // Firestore 1MB doc limit hit
    if (e.code === 'invalid-argument' || e.message?.includes('larger than')) {
      toast('Image too large even after compression. Use a smaller photo.', 'err');
    } else {
      toast('Error: ' + e.message, 'err');
    }
  } finally {
    if (btn) { btn.innerHTML = origTxt; btn.disabled = false; }
  }
};
window.editCert   = id => openModal('cert', id);
window.deleteCert = async function(id) {
  if (!confirm('Delete?')) return;
  try { await deleteDoc(doc(db, 'certificates', id)); toast('Deleted'); loadCertificates(); }
  catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ════════════════════════════════════════════════════════════
//  SOCIAL LINKS
// ════════════════════════════════════════════════════════════
async function loadSocials() {
  if (!db) { setDefaultSocials(); return; }
  try {
    const snap = await getDoc(doc(db, 'portfolio', 'socials'));
    const d = snap.exists() ? snap.data() : {};
    document.getElementById('sGithub').value    = d.github    || 'https://github.com/surajkr0208';
    document.getElementById('sLinkedin').value  = d.linkedin  || 'https://www.linkedin.com/in/suraj-sk0208/';
    document.getElementById('sTwitter').value   = d.twitter   || 'https://x.com/SurajKu00464975';
    document.getElementById('sInstagram').value = d.instagram || 'https://www.instagram.com/suraj.kumar.0208';
    document.getElementById('sReddit').value    = d.reddit    || 'https://www.reddit.com/u/Antique-Guava-6497/';
    document.getElementById('sDiscord').value   = d.discord   || 'https://discord.com/users/1289820689469276212';
    document.getElementById('sEmail').value     = d.email     || 'surajkumarmahto7033@gmail.com';
  } catch { setDefaultSocials(); }
}
function setDefaultSocials() {
  document.getElementById('sGithub').value   = 'https://github.com/surajkr0208';
  document.getElementById('sLinkedin').value = 'https://www.linkedin.com/in/suraj-sk0208/';
  document.getElementById('sEmail').value    = 'surajkumarmahto7033@gmail.com';
}
window.saveSocials = async function() {
  if (needsDb()) return;
  const data = {
    github:    document.getElementById('sGithub').value,
    linkedin:  document.getElementById('sLinkedin').value,
    twitter:   document.getElementById('sTwitter').value,
    instagram: document.getElementById('sInstagram').value,
    reddit:    document.getElementById('sReddit').value,
    discord:   document.getElementById('sDiscord').value,
    email:     document.getElementById('sEmail').value,
  };
  try {
    await setDoc(doc(db, 'portfolio', 'socials'), data);
    toast('✅ Social links saved!');
  } catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ════════════════════════════════════════════════════════════
//  MESSAGES
// ════════════════════════════════════════════════════════════
async function loadMessages() {
  if (!db) return;
  const list = document.getElementById('messagesList');
  try {
    const snap = await getDocs(query(collection(db, 'contacts'), orderBy('ts', 'desc')));
    if (snap.empty) {
      list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-3);"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>No messages yet.</div>';
      return;
    }
    
    list.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const date = d.ts ? new Date(d.ts.toDate()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown Date';
      return `
        <div class="msg-item" style="padding: 1.25rem 1.5rem; background: var(--surface); display: flex; gap: 1rem; align-items: flex-start; justify-content: space-between;">
          <div style="flex: 1;">
            <div style="display:flex; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="color: var(--text); font-size: 1rem;">${d.name || 'Anonymous'}</strong> 
                <a href="mailto:${d.email}" style="color: var(--accent); font-size: 0.85rem; margin-left: 0.5rem;"><i class="fas fa-envelope"></i> ${d.email}</a>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-3);">${date}</span>
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-2); margin-bottom: 0.5rem;">Subject: ${d.subject || 'No Subject'}</div>
            <div style="font-size: 0.9rem; color: var(--text-2); line-height: 1.5; white-space: pre-wrap; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px;">${d.msg || ''}</div>
          </div>
          <button class="btn btn-ghost btn-sm btn-icon" style="color: var(--red); flex-shrink: 0;" onclick="deleteMessage('${doc.id}')" title="Delete Message"><i class="fas fa-trash"></i></button>
        </div>
      `;
    }).join('');
  } catch(e) {
    list.innerHTML = `<div style="padding:2rem;color:var(--red)">Error loading messages: ${e.message}</div>`;
  }
}

window.deleteMessage = async function(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  try {
    await deleteDoc(doc(db, 'contacts', id));
    toast('Message deleted');
    loadMessages();
  } catch(e) {
    toast('Error: ' + e.message, 'err');
  }
};

// ── Topbar "Save" dispatcher ──────────────────────────────
window.saveCurrentPage = function() {
  const active = document.querySelector('.page.active')?.id.replace('page-', '');
  if (active === 'profile') saveProfile();
  if (active === 'socials') saveSocials();
};

// ── Escape key closes modals ──────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.d-modal.open').forEach(m => m.classList.remove('open'));
});

// ── Init ──────────────────────────────────────────────────
loadOverview();

// ── Theme Toggle (Dark / Light) ──────────────────────
(function() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  if (!btn) return;
  const [sun, moon] = btn.querySelectorAll('i');

  function applyIcons() {
    const light = html.getAttribute('data-theme') === 'light';
    sun.style.opacity  = light ? '0'   : '1';
    sun.style.transform  = light ? 'scale(0) rotate(90deg)'  : 'scale(1) rotate(0deg)';
    moon.style.opacity = light ? '1'   : '0';
    moon.style.transform = light ? 'scale(1) rotate(0deg)'   : 'scale(0) rotate(-90deg)';
  }
  applyIcons();

  btn.addEventListener('click', () => {
    const isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) { html.removeAttribute('data-theme'); localStorage.setItem('theme','dark'); }
    else         { html.setAttribute('data-theme','light'); localStorage.setItem('theme','light'); }
    applyIcons();
  });
})();
