# 🚀 SETUP GUIDE — Suraj Kumar Mahto Portfolio

Follow these steps **once** to connect Firebase and go live.

---

## Step 1 — Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → Name it `suraj-portfolio` → Continue
3. Disable Google Analytics (optional) → **Create project**

---

## Step 2 — Enable Authentication

1. In Firebase Console → **Authentication** → **Get Started**
2. Click **Sign-in method** tab → Enable **Email/Password**
3. Go to **Users** tab → **Add user**
   - Email: `surajkumarmahto7033@gmail.com`
   - Password: *(choose a strong password — this is your admin password)*

---

## Step 3 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** → Select region (e.g., `asia-south1` for India)
3. After creation → **Rules** tab → Paste the content of `firestore.rules` → **Publish**

---

## Step 4 — Enable Firebase Storage

1. Firebase Console → **Storage** → **Get Started** → **Production mode** → Finish
2. After creation → **Rules** tab → Paste the content of `storage.rules` → **Publish**

---

## Step 5 — Get Your Firebase Config

1. Firebase Console → **Project Settings** (gear icon) → **General** tab
2. Scroll down to **"Your apps"** → Click **"</>"** (Web) → Register app
3. Name it `portfolio-web` → **Register app**
4. Copy the `firebaseConfig` object shown

---

## Step 6 — Add Config to Your Project

Open `public/js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIza...",       // ← paste here
  authDomain:        "suraj-portfolio.firebaseapp.com",
  projectId:         "suraj-portfolio",
  storageBucket:     "suraj-portfolio.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## Step 7 — Add Your Photos

Copy the following files into `public/assets/`:

| File | What to save |
|------|-------------|
| `profile.jpg` | Your formal photo (from the one you shared) |
| `certificates/pinnacle-cert.jpg` | Pinnacle Labs certificate |
| `resume.pdf` | Your CV/resume (optional) |

---

## Step 8 — Install Firebase CLI & Deploy

Open PowerShell in the `Profile_website` folder and run:

```powershell
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (select Hosting, use existing project)
firebase init hosting

# Deploy!
firebase deploy
```

Your site will be live at: **`https://YOUR-PROJECT-ID.web.app`**

---

## Step 9 — First Login

1. Open `https://your-site.web.app/login.html`
2. Sign in with `surajkumarmahto7033@gmail.com` + the password you set in Step 2
3. You'll be taken to the **Admin Dashboard**

---

## Step 10 — Initialize Your Portfolio Data

In the Dashboard:
1. Go to **Edit Profile** → fill in your details → **Save**
2. Go to **Skills** → Add all 10 skills
3. Go to **Projects** → Add your 3 projects
4. Go to **Experience** → Add Pinnacle Labs internship
5. Go to **Certificates** → Upload the Pinnacle certificate
6. Go to **Social Links** → Verify all links → Save

---

## Accessing the Vault

1. Go to `https://your-site.web.app/vault.html`
2. Login with your credentials
3. Upload documents using drag-and-drop
4. Documents are stored in **Firebase Storage** — only you can access them
5. Vault auto-locks after **10 minutes** of inactivity

---

## Security Notes

- ✅ Public portfolio data is readable by anyone but writable only by you
- ✅ Vault documents are accessible **only** by your authenticated account
- ✅ Firebase Storage rules enforce this at the server level
- ✅ The vault login page is not linked from the public portfolio
- ✅ Auto-lock protects the vault if you forget to log out

---

## Custom Domain (Optional)

1. Firebase Console → **Hosting** → **Add custom domain**
2. Enter your domain → Follow DNS verification steps
3. SSL is provisioned automatically (free)

---

## Questions?

Email: surajkumarmahto7033@gmail.com
