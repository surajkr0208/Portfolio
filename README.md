# 🌐 Suraj Kumar Mahto — Personal Portfolio

<div align="center">

![Portfolio Preview](https://suraj-portfolio-df5e3.web.app)

[![Firebase Hosting](https://img.shields.io/badge/Hosted%20on-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://suraj-portfolio-df5e3.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-surajkr0208-181717?style=for-the-badge&logo=github)](https://github.com/surajkr0208)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Suraj%20Kumar%20Mahto-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/suraj-sk0208/)

**🔗 Live Site: [suraj-portfolio-df5e3.web.app](https://suraj-portfolio-df5e3.web.app)**

</div>

---

## ✨ Features

### 🎨 Public Portfolio
| Feature | Details |
|---------|---------|
| **Hero Section** | Animated typewriter effect, particle background, social links |
| **About Me** | Live stat counters (Projects, Stars, Skills, Internship) |
| **Skills** | Animated SVG skill rings with proficiency percentages |
| **Projects** | Admin-managed + **auto-synced from GitHub** (deduplicated) |
| **Experience** | Timeline view, fetched live from Firestore |
| **Certificates** | Gallery with lightbox modal viewer |
| **AI Assistant** | Real-time Gemini 2.5 Flash chatbot with streaming response |
| **Contact Form** | EmailJS-powered, sends directly to inbox |
| **GitHub Activity** | Live contribution graph, repo count, star count |
| **Dark / Light Mode** | Toggle with localStorage persistence, no flash |
| **Responsive** | Fully mobile-friendly |

### 🔧 Admin Dashboard
| Feature | Details |
|---------|---------|
| **Authentication** | Firebase Email/Password auth with 10-min auto-logout |
| **Edit Profile** | Name, bio, photo, email, location, social links, resume |
| **Skills Manager** | Add / edit / delete skills with reorder |
| **Projects Manager** | Admin projects + read-only GitHub repos (auto-synced) |
| **Experience Manager** | Add internships and work experience |
| **Certificates Manager** | Upload certificate images, stored as base64 in Firestore |
| **Real-time Sync** | `onSnapshot` listeners — changes reflect on portfolio instantly |
| **GitHub Stats** | Live repo count, star count, refreshed every 5 minutes |
| **Overview Dashboard** | Live stat boxes for all sections |

### 🔒 Personal Document Vault
| Feature | Details |
|---------|---------|
| **Secure Login** | Separate vault password, sessionStorage-based |
| **Auto-lock** | Locks after 10 minutes of inactivity |
| **File Upload** | Drag & drop, supports PDF, images, docs |
| **Storage** | Supabase Storage (free tier, full CORS support) |
| **PDF Viewer** | Opens PDFs in browser natively |
| **Download** | One-click download for all files |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Vanilla CSS, Vanilla JavaScript (ES Modules) |
| **Auth** | Firebase Authentication (Email/Password) |
| **Database** | Firebase Firestore (real-time `onSnapshot`) |
| **File Storage** | Supabase Storage (vault documents) |
| **Hosting** | Firebase Hosting |
| **GitHub Sync** | GitHub REST API (public, no token required) |
| **Email** | EmailJS |
| **Animations** | tsParticles, CSS transitions |
| **Fonts** | Google Fonts (Outfit, Space Grotesk) |

---

## 📁 Project Structure

```
Profile_website/
├── public/
│   ├── index.html          # Main portfolio page
│   ├── dashboard.html      # Admin dashboard
│   ├── vault.html          # Personal document vault
│   ├── login.html          # Admin login
│   ├── 404.html            # Custom 404 page
│   ├── assets/
│   │   ├── profile.jpg     # Profile photo
│   │   ├── resume.pdf      # CV/Resume
│   │   └── certificates/   # Certificate images
│   ├── css/
│   │   ├── style.css       # Portfolio styles + light/dark mode
│   │   ├── dashboard.css   # Admin dashboard styles
│   │   └── vault.css       # Vault styles
│   └── js/
│       ├── app.js          # Portfolio logic + GitHub sync + real-time
│       ├── dashboard.js    # Admin dashboard logic
│       ├── vault.js        # Vault logic + Supabase integration
│       ├── auth.js         # Auth helpers
│       ├── firebase-config.js   # Firebase initialization
│       └── supabase-config.js   # Supabase initialization
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage rules
├── firebase.json           # Firebase hosting config
├── SETUP.md                # Setup guide
└── README.md               # This file
```

---

## 🚀 GitHub Auto-Sync

This portfolio automatically syncs with your GitHub profile:

- **On every page load** — fetches latest repos from `api.github.com`
- **Every 5 minutes** — polls for updated star counts and new repos
- **Deduplication** — repos already added via admin panel are never shown twice
- **Contribution graph** — embedded live from [ghchart.rshah.org](https://ghchart.rshah.org)
- **No API token needed** — uses public GitHub REST API

To make a new repo appear automatically on the portfolio:
1. Push the repo to GitHub
2. Add a **description** to the repo
3. It appears on the portfolio within 5 minutes ✅

---

## ⚡ Real-Time Data Sync

Portfolio data updates **instantly** using Firestore `onSnapshot` listeners:

| Data | Update Speed |
|------|-------------|
| Skills | ⚡ Instant |
| Projects | ⚡ Instant |
| Experience | ⚡ Instant |
| Certificates | ⚡ Instant |
| GitHub Repos | 🔄 Every 5 min |
| GitHub Stars | 🔄 Every 5 min |

---

## 🔧 Quick Setup

See **[SETUP.md](./SETUP.md)** for full step-by-step instructions.

**Prerequisites:**
- Node.js + npm installed
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (free Spark plan)
- A Supabase project (free tier) for the vault

---

## 🌐 Deployment

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Live at: `https://YOUR-PROJECT-ID.web.app`

---

## 📬 Contact

| Platform | Link |
|----------|------|
| **Email** | [surajkumarmahto7033@gmail.com](mailto:surajkumarmahto7033@gmail.com) |
| **LinkedIn** | [linkedin.com/in/suraj-sk0208](https://www.linkedin.com/in/suraj-sk0208/) |
| **GitHub** | [github.com/surajkr0208](https://github.com/surajkr0208) |
| **Portfolio** | [suraj-portfolio-df5e3.web.app](https://suraj-portfolio-df5e3.web.app) |

---

<div align="center">

Made with ❤️ by **Suraj Kumar Mahto**

⭐ Star this repo if you found it useful!

</div>
