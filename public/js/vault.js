// ============================================================
//  DOCUMENT VAULT JS — Suraj Kumar Mahto
//  Files → Supabase Storage (1GB free, full CORS support)
//  Metadata → Firestore (free tier)
// ============================================================

import { auth, db }    from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadToSupabase, deleteFromSupabase, isSupabaseConfigured }
  from './supabase-config.js';

// ── State ────────────────────────────────────────────────
let currentUser  = null;
let allFiles     = [];
let activeCat    = 'all';
const LOCK_SECS  = 600; // 10 minutes
let remaining    = LOCK_SECS;
let autoLockTimer;

// ── Toast ────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Lock / Unlock ────────────────────────────────────────
const lockScreen = document.getElementById('lockScreen');
const vaultApp   = document.getElementById('vaultApp');

function showVault(user) {
  currentUser = user;
  lockScreen.classList.add('hidden');
  vaultApp.classList.add('show');
  loadFiles();
  startAutoLock();
}

function lockNow() {
  clearInterval(autoLockTimer);
  lockScreen.classList.remove('hidden');
  vaultApp.classList.remove('show');
  document.getElementById('lockPass').value = '';
  const errEl = document.getElementById('lockErr');
  if (errEl) errEl.classList.remove('show');
  sessionStorage.removeItem('vault_unlocked');
  remaining = LOCK_SECS;
}
window.lockNow = lockNow;

// Session-based auto-unlock (survives refresh, clears on tab close)
if (auth && sessionStorage.getItem('vault_unlocked') === 'true') {
  onAuthStateChanged(auth, user => { if (user) showVault(user); });
}

// ── Login ─────────────────────────────────────────────────
const eyeToggle = document.getElementById('eyeToggle');
const lockPass  = document.getElementById('lockPass');
const eyeIco    = document.getElementById('eyeIco');
eyeToggle?.addEventListener('click', () => {
  const show = lockPass.type === 'password';
  lockPass.type = show ? 'text' : 'password';
  eyeIco.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
});

document.getElementById('unlockBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('lockEmail').value.trim();
  const pass  = lockPass.value;
  const btn   = document.getElementById('unlockBtn');
  const err   = document.getElementById('lockErr');
  err.classList.remove('show');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unlocking…';
  btn.disabled  = true;

  if (!auth) {
    err.textContent = 'Firebase not configured. Follow SETUP.md.';
    err.classList.add('show');
    btn.innerHTML = '<i class="fas fa-unlock-keyhole"></i> Unlock Vault';
    btn.disabled  = false;
    return;
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    sessionStorage.setItem('vault_unlocked', 'true');
    showVault(cred.user);
  } catch(e) {
    let msg = 'Incorrect credentials. Please try again.';
    if (e.code === 'auth/too-many-requests') msg = 'Too many attempts. Try later.';
    err.textContent = msg; err.classList.add('show');
    btn.innerHTML = '<i class="fas fa-unlock-keyhole"></i> Unlock Vault';
    btn.disabled  = false;
  }
});
lockPass.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('unlockBtn')?.click(); });

// ── Auto-lock timer ───────────────────────────────────────
function startAutoLock() {
  clearInterval(autoLockTimer);
  remaining = LOCK_SECS;
  autoLockTimer = setInterval(() => {
    remaining--;
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = `${m}:${s}`;
    if (remaining <= 0) lockNow();
  }, 1000);
}
function resetTimer() { remaining = LOCK_SECS; }
document.addEventListener('mousemove', resetTimer);
document.addEventListener('keydown',   resetTimer);
document.addEventListener('click',     resetTimer);

// ── Load files from Firestore ─────────────────────────────
async function loadFiles() {
  if (!db || !currentUser) { renderFiles([]); return; }
  try {
    const snap = await getDocs(query(collection(db, 'vault'), orderBy('uploadedAt', 'desc')));
    allFiles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFiles(filterByActiveCat());
    updateCounts();
  } catch(e) {
    toast('Failed to load files: ' + e.message, 'err');
    renderFiles([]);
  }
}

function filterByActiveCat() {
  if (activeCat === 'all') return allFiles;
  return allFiles.filter(f => f.category === activeCat);
}

function updateCounts() {
  const cats = ['identity','academic','professional','financial','other'];
  document.getElementById('count-all').textContent = allFiles.length;
  cats.forEach(c => {
    const el = document.getElementById('count-' + c);
    if (el) el.textContent = allFiles.filter(f => f.category === c).length;
  });
}

// ── Category filter ───────────────────────────────────────
window.filterCat = function(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  const labels = {
    all:'All Documents', identity:'🪪 Identity Documents', academic:'🎓 Academic Records',
    professional:'💼 Professional Documents', financial:'🏦 Financial Documents', other:'📁 Other Documents'
  };
  document.getElementById('catHeading').textContent = labels[cat] || cat;
  renderFiles(filterByActiveCat());
};
window.filterCatSelect = function() {
  activeCat = document.getElementById('catSelect').value;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  renderFiles(filterByActiveCat());
};
window.filterSearch = function() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const base = filterByActiveCat();
  renderFiles(q ? base.filter(f => f.name.toLowerCase().includes(q)) : base);
};

// ── Drag & Drop ───────────────────────────────────────────
window.dragOver  = e => { e.preventDefault(); document.getElementById('dropZone').classList.add('drag-over'); };
window.dragLeave = () => document.getElementById('dropZone').classList.remove('drag-over');
window.dropFiles = e => {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
};

window.handleFiles = async function(files) {
  if (!files || !files.length) return;
  if (!currentUser) { toast('Not authenticated', 'err'); return; }
  if (!db) { toast('Firebase not configured', 'err'); return; }
  const cat = document.getElementById('catSelect').value;
  for (const file of Array.from(files)) {
    await uploadFile(file, cat);
  }
  loadFiles();
};

// ── Upload to Supabase Storage (Free, CORS-friendly) ───────
async function uploadFile(file, category) {
  const MAX = 50 * 1024 * 1024;
  if (file.size > MAX) { toast(`${file.name} exceeds 50MB limit`, 'err'); return; }

  const prog = document.getElementById('uploadProgress');
  const bar  = document.getElementById('upBar');
  const lbl  = document.getElementById('upLbl');

  if (!isSupabaseConfigured()) {
    toast('⚠️ Supabase not configured.', 'err');
    return;
  }

  prog.classList.add('show');
  lbl.textContent = `Uploading ${file.name}…`;
  bar.style.width = '0%';

  try {
    const result = await uploadToSupabase(
      file,
      currentUser.uid,  // folder = user's UID
      pct => { bar.style.width = pct + '%'; }
    );

    // Save metadata to Firestore
    await addDoc(collection(db, 'vault'), {
      name:        file.name,
      category,
      size:        file.size,
      type:        file.type,
      url:         result.url,
      storagePath: result.storagePath,  // Needed for deletion
      uploadedAt:  new Date().toISOString()
    });

    toast(`✅ ${file.name} uploaded!`);
  } catch(e) {
    toast('Upload failed: ' + e.message, 'err');
  } finally {
    prog.classList.remove('show');
    bar.style.width = '0%';
  }
}

// ── Render files ──────────────────────────────────────────
const FILE_ICONS = {
  'application/pdf':    { ico:'fas fa-file-pdf',   color:'#EF4444' },
  'image/':             { ico:'fas fa-file-image',  color:'#06B6D4' },
  'application/msword': { ico:'fas fa-file-word',   color:'#3B82F6' },
  'application/vnd.openxmlformats': { ico:'fas fa-file-word', color:'#3B82F6' },
  'text/':              { ico:'fas fa-file-lines',  color:'#10B981' },
};
function getFileIcon(type = '') {
  for (const k in FILE_ICONS) if (type.startsWith(k)) return FILE_ICONS[k];
  return { ico:'fas fa-file', color:'#94A3B8' };
}
function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1024 / 1024).toFixed(1) + 'MB';
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function renderFiles(files) {
  const grid = document.getElementById('filesGrid');
  if (!files.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-vault"></i>
        <p>No documents here yet.<br/>Upload your first file above!</p>
      </div>`;
    return;
  }
  grid.innerHTML = files.map(f => {
    const { ico, color } = getFileIcon(f.type || '');
    const isImg = (f.type || '').startsWith('image/');
    return `
    <div class="file-card" data-id="${f.id}">
      <div class="file-thumb" onclick="openPreview('${f.id}')">
        ${isImg
          ? `<img src="${f.url}" alt="${f.name}" loading="lazy"/>`
          : `<i class="${ico} file-ico" style="color:${color}"></i>`
        }
        <div class="file-thumb-overlay">
          <button class="thumb-btn" title="Preview" onclick="event.stopPropagation();openPreview('${f.id}')"><i class="fas fa-eye"></i></button>
          <a class="thumb-btn" title="Download" href="${f.url}" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-download"></i></a>
        </div>
      </div>
      <div class="file-info">
        <div class="file-name" title="${f.name}">${f.name}</div>
        <div class="file-meta">
          <span class="file-size">${fmtSize(f.size)}</span>
          <span class="file-date">${fmtDate(f.uploadedAt)}</span>
        </div>
      </div>
      <div class="file-actions">
        <button class="f-btn f-btn-view" onclick="openPreview('${f.id}')"><i class="fas fa-eye"></i> View</button>
        <a class="f-btn f-btn-dl" href="${f.url}" target="_blank"><i class="fas fa-download"></i> Save</a>
        <button class="f-btn f-btn-del" onclick="deleteFile('${f.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

// ── Delete — removes from Supabase Storage + Firestore record ──
window.deleteFile = async function(id) {
  if (!confirm('Remove this document from your vault?')) return;
  const file = allFiles.find(f => f.id === id);
  if (!file) return;
  try {
    // Delete from Supabase Storage if we have the path
    if (file.storagePath) {
      try { await deleteFromSupabase(file.storagePath); } catch(se) {
        console.warn('Storage delete failed (may already be gone):', se);
      }
    }
    await deleteDoc(doc(db, 'vault', id));
    allFiles = allFiles.filter(f => f.id !== id);
    renderFiles(filterByActiveCat());
    updateCounts();
    toast('Document removed from vault');
  } catch(e) { toast('Error: ' + e.message, 'err'); }
};

// ── Preview modal ─────────────────────────────────────────
window.openPreview = function(id) {
  const file = allFiles.find(f => f.id === id);
  if (!file) return;

  const isImg = (file.type || '').startsWith('image/');
  const isDoc = file.type === 'application/pdf' || (file.type || '').includes('word');

  document.getElementById('previewTitle').textContent = file.name;
  document.getElementById('previewDlBtn').href        = file.url;
  document.getElementById('previewDlBtn').download    = file.name;
  document.getElementById('previewDlBtn').target      = '_blank';

  const body  = document.getElementById('previewBody');

  if (isImg) {
    body.innerHTML = `<img src="${file.url}" alt="${file.name}" style="max-width:100%;max-height:70vh;border-radius:8px"/>`;
  } else if (file.type === 'application/pdf') {
    // Native PDF.js rendering — fetches bytes and draws directly onto canvas
    // This bypasses the forced-download Content-Type from storage providers.
    // pdf.js renders locally in-browser without needing inline viewer support.
    body.innerHTML = `
      <div id="pdfContainer" style="width:100%;height:70vh;overflow-y:auto;background:#2d2d35;border-radius:8px;position:relative;text-align:center">
        <div id="pdfLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#94a3b8">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p style="margin-top:10px;font-size:0.9rem">Loading secure PDF viewer...</p>
        </div>
      </div>
    `;
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => renderPDF(file.url);
      document.head.appendChild(script);
    } else {
      renderPDF(file.url);
    }
  } else {
    body.innerHTML = `
      <div style="text-align:center;color:var(--text-2);padding:3rem">
        <i class="fas fa-file" style="font-size:4rem;opacity:.3;display:block;margin-bottom:1rem"></i>
        <p style="margin-bottom:1.5rem">Native preview not available for this file type.</p>
        <p style="font-size:0.8rem; color:#94a3b8">Preview not supported for this file type — use the Download button.</p>
      </div>`;
  }

  document.getElementById('previewModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closePreview = function() {
  document.getElementById('previewModal').classList.remove('open');
  document.getElementById('previewBody').innerHTML = '';
  document.body.style.overflow = '';
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePreview(); });

// ── Native PDF Rendering ──────────────────────────────────
function renderPDF(url) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const container = document.getElementById('pdfContainer');
  
  window.pdfjsLib.getDocument(url).promise.then(pdf => {
    const loading = document.getElementById('pdfLoading');
    if (loading) loading.style.display = 'none';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      pdf.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: 1.3 });
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = '1rem auto';
        canvas.style.borderRadius = '4px';
        canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        page.render({ canvasContext: context, viewport: viewport });
        if (container) container.appendChild(canvas);
      });
    }
  }).catch(err => {
    const loading = document.getElementById('pdfLoading');
    if (loading) loading.innerHTML = `<p style="color:#ef4444"><i class="fas fa-exclamation-triangle"></i> Failed to load PDF preview.</p>`;
  });
}

// ── Theme Toggle (Dark / Light) ────────────────────────────
(function() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  if (!btn) return;
  const [sun, moon] = btn.querySelectorAll('i');

  function applyIcons() {
    const light = html.getAttribute('data-theme') === 'light';
    sun.style.opacity    = light ? '0' : '1';
    sun.style.transform  = light ? 'scale(0) rotate(90deg)'  : 'scale(1) rotate(0deg)';
    moon.style.opacity   = light ? '1' : '0';
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
