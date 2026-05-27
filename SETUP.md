# 🚀 SETUP GUIDE — Suraj Kumar Mahto Portfolio

Follow these steps **once** to connect Firebase, Supabase, and go live.

---

## Step 1 — Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → Name it `suraj-portfolio` → Continue
3. Disable Google Analytics (optional) → **Create project**

---

## Step 2 — Enable Authentication

1. Firebase Console → **Authentication** → **Get Started**
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

## Step 4 — Get Your Firebase Config

1. Firebase Console → **Project Settings** (gear icon) → **General** tab
2. Scroll down to **"Your apps"** → Click **"</>"** (Web) → Register app
3. Name it `portfolio-web` → **Register app**
4. Copy the `firebaseConfig` object shown

Open `public/js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "suraj-portfolio.firebaseapp.com",
  projectId:         "suraj-portfolio",
  storageBucket:     "suraj-portfolio.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## Step 5 — Set Up Supabase (Document Vault)

The personal document vault uses **Supabase Storage** (free tier).

1. Go to **https://supabase.com** → Create a free account
2. Click **"New project"** → Name it `portfolio-vault`
3. Wait for the project to initialize (~1 minute)
4. Go to **Storage** → **Create bucket** → Name it `vault-documents`
5. Set bucket to **Private**
6. Go to **Project Settings** → **API**:
   - Copy your **Project URL** (looks like `https://xxxx.supabase.co`)
   - Copy your **anon public** key
7. Open `public/js/supabase-config.js` and paste:

```js
const SUPABASE_URL = "https://your-project.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

8. Go to **Storage** → **Policies** → Add a policy to allow authenticated uploads:
   - Or set the bucket to public for simplicity on the free tier

---

## Step 6 — Add Your Assets

Copy the following files into `public/assets/`:

| File | What to save |
|------|-------------|
| `profile.jpg` | Your profile photo |
| `certificates/pinnacle-cert.jpg` | Pinnacle Labs certificate |
| `resume.pdf` | Your CV/resume |

---

## Step 7 — Install Firebase CLI & Deploy

Open PowerShell in the `Profile_website` folder and run:

```powershell
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (select Hosting, use existing project)
firebase init hosting

# Deploy!
firebase deploy --only hosting
```

Your site will be live at: **`https://YOUR-PROJECT-ID.web.app`**

---

## Step 8 — First Login & Setup

1. Open `https://your-site.web.app/login.html`
2. Sign in with your email + password set in Step 2
3. You'll be taken to the **Admin Dashboard**

In the Dashboard, set up each section:
1. **Edit Profile** → Fill in name, bio, photo, email, location → Save
2. **Skills** → Add your technical skills
3. **Projects** → Add your projects *(GitHub repos auto-sync separately)*
4. **Experience** → Add internships and work history
5. **Certificates** → Upload certificate images
6. **Social Links** → Add GitHub, LinkedIn, Twitter, etc.

---

## Step 9 — GitHub Auto-Sync

Your GitHub public repos **auto-sync** to the portfolio with no setup needed!

- Any repo with a **description** filled in will appear automatically
- Repos already added via the admin panel are **deduplicated** (won't show twice)
- Stats (repo count, stars) refresh **every 5 minutes**
- Contribution graph updates **daily** automatically

**To show a new project**: Just push it to GitHub and add a description. ✅

---

## Accessing the Vault

1. Go to `https://your-site.web.app/vault.html`
2. Login with your vault password
3. Upload documents using drag-and-drop
4. Documents are stored in **Supabase Storage** — only you can access them
5. Vault auto-locks after **10 minutes** of inactivity
6. Session is maintained as long as the browser tab is open

---

## Security Notes

- ✅ Public portfolio data is readable by anyone, writable only by you (Firestore rules)
- ✅ Vault documents are stored in Supabase with a private bucket
- ✅ Admin dashboard requires Firebase Authentication
- ✅ Auto-lock protects the vault after 10 min inactivity
- ✅ Session expires when the browser tab is closed

---

## Real-Time Updates

All portfolio sections update **instantly** using Firestore `onSnapshot` listeners:
- Add a skill in the dashboard → it appears on the portfolio within 1-2 seconds
- No page refresh needed

---

## Custom Domain (Optional)

1. Firebase Console → **Hosting** → **Add custom domain**
2. Enter your domain → Follow DNS verification steps
3. SSL is provisioned automatically (free)

---

## Questions?

📧 Email: surajkumarmahto7033@gmail.com  
🔗 LinkedIn: [linkedin.com/in/suraj-sk0208](https://www.linkedin.com/in/suraj-sk0208/)
