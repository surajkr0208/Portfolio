// ============================================================
//  CLOUDINARY CONFIG — Free image/file hosting
//  Sign up FREE (no credit card) at https://cloudinary.com
//  Then create an UNSIGNED upload preset and fill in below
// ============================================================

export const CLOUDINARY = {
  cloudName: 'dv8afwyuy',
  uploadPreset: 'portfolio_upload'
};

/**
 * Upload any file to Cloudinary (unsigned).
 * Returns the secure_url and public_id.
 */
export async function uploadToCloudinary(file, folder = 'vault', onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);
  formData.append('folder', folder);

  // Determine resource type. Cloudinary restricts PDFs if uploaded as 'image' (auto does this).
  // Using 'raw' for documents ensures they aren't blocked by the image processing engine.
  let resourceType = 'auto';
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    resourceType = 'raw';
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/${resourceType}/upload`
    );

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data);
        }
      } catch {
        reject(new Error('Invalid response from Cloudinary'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

export function isCloudinaryConfigured() {
  return true;
}