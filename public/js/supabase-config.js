// ============================================================
//  SUPABASE CONFIG — Free file storage (1GB, no credit card)
//  Replaces Cloudinary for document vault storage
//  Full CORS support → PDFs preview & download natively
// ============================================================

const SUPABASE_URL = 'https://ujjqgvjxvxnedmkoxgks.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqanFndmp4dnhuZWRta294Z2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjQwODcsImV4cCI6MjA5NTQ0MDA4N30.sKFkxviuw2PvQP_I3PZkqmmtcNi63yagZj9hcjVpmUY';
const BUCKET      = 'vault';

export function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL';
}

/**
 * Upload a file to Supabase Storage with progress tracking.
 * Returns { url, storagePath }
 */
export function uploadToSupabase(file, folder, onProgress) {
  const safeName   = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const storagePath = `${folder}/${safeName}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Public URL — works natively in browsers with full CORS headers
        const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
        resolve({ url, storagePath });
      } else {
        let msg = 'Upload failed';
        try { msg = JSON.parse(xhr.responseText).message || msg; } catch(_) {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/**
 * Delete a file from Supabase Storage by its storagePath.
 */
export async function deleteFromSupabase(storagePath) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method:  'DELETE',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ prefixes: [storagePath] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete file from storage');
  }
}
