# 🎵 Groove & Co.

> A premium vinyl record e-commerce store — pressed, not streamed.

![Groove & Co. Aurora UI](https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20Supabase-blueviolet?style=for-the-badge)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-gold?style=for-the-badge)

---

## ✨ Features

- **Aurora UI** — Dark-mode premium design with glassmorphism, gradient backgrounds, and micro-animations
- **Smooth Vinyl Physics** — `requestAnimationFrame` loop drives realistic record spin with acceleration/deceleration on hover
- **Real Album Catalog** — 58+ iconic albums seeded from the iTunes API with real high-resolution artwork
- **Global Archive Search** — Live search across Apple Music's entire catalog (millions of albums) powered by a backend iTunes proxy
- **Pagination** — 12 albums shown initially with a "Load more" button
- **Authentication** — JWT + bcrypt (12 rounds) auth with register, login, forgot/reset password flows
- **Route Guards** — Protected routes for checkout; guest-only routes for login/register
- **PostgreSQL on Supabase** — Fully hosted cloud database with connection pooling
- **Wishlist** — Persistent client-side wishlist with heart toggle
- **Cart & Checkout** — Cart drawer with quantity control, order placement stored to DB
- **Deployed on Vercel** — Frontend + Express serverless functions in one repo

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v7, Vite |
| Styling | Vanilla CSS (Aurora Design System) |
| Icons | Lucide React |
| Backend | Express 5 (Vercel Serverless) |
| Database | PostgreSQL via Supabase |
| Auth | bcrypt + JSON Web Tokens (7-day TTL) |
| External API | iTunes Search API (album artwork + live search) |
| Hosting | Vercel (Frontend + API) |
| Version Control | GitHub |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project (or local PostgreSQL)

### 1. Clone the repo
```bash
git clone https://github.com/kenpachi002/ECommerceAlbum.git
cd ECommerceAlbum
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
PORT=4000
JWT_SECRET=your-long-random-secret-here
```

### 4. Set up the database schema
```bash
npm run db:setup
```

### 5. Seed real album data
```bash
npm run db:seed-real
```
> Fetches 58 curated iconic albums from the iTunes API (Miles Davis, Radiohead, Kendrick Lamar, Burial, etc.) with real artwork, stable pseudo-random pricing, and Digital variants.

### 6. Run the development servers

**Terminal 1 — Backend API:**
```bash
npm run server
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
├── api/
│   └── index.js              # Vercel serverless entry point
├── server/
│   ├── server.js             # Express app (products, orders, iTunes proxy)
│   ├── auth.js               # Auth routes (register, login, forgot/reset password)
│   ├── db.js                 # PostgreSQL pool with SSL config
│   ├── schema.sql            # Database schema
│   ├── setup-db.js           # Schema runner
│   ├── seed.sql              # Original fictional seed data
│   └── seed-real.js          # iTunes-powered real album seeder
├── src/
│   ├── app/App.jsx           # Root app, routes, auth guards
│   ├── components/
│   │   ├── catalog/          # RecordArt (rAF physics), ProductCard
│   │   ├── cart/             # CartDrawer
│   │   ├── layout/           # Header, Footer
│   │   └── ui/               # SkeletonCard, EmptyState
│   ├── features/
│   │   ├── auth/AuthContext.jsx   # JWT session management
│   │   ├── cart/useCart.js        # Cart state (localStorage)
│   │   └── wishlist/useWishlist.js
│   ├── pages/
│   │   ├── CatalogPage.jsx   # Main catalog + pagination + iTunes live search
│   │   ├── ProductPage.jsx
│   │   ├── CheckoutPage.jsx  # Protected route
│   │   ├── LoginPage.jsx     # Guest-only route
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   └── styles/
│       ├── tokens.css        # Design tokens (colors, spacing, typography)
│       ├── globals.css       # Base styles, Aurora background
│       └── components.css    # All component styles
├── .env.example
├── vercel.json               # Vercel routing config
└── vite.config.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | — | Paginated album catalog (12/page, filter by genre/format/search) |
| `GET` | `/api/products/:id` | — | Single album with all variants |
| `GET` | `/api/search/itunes?q=` | — | Live search across Apple Music's full catalog |
| `POST` | `/api/orders` | — | Place an order |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Login, receive JWT |
| `GET` | `/api/auth/me` | Bearer | Get current user |
| `POST` | `/api/auth/forgot-password` | — | Request password reset token |
| `POST` | `/api/auth/reset-password` | — | Set new password via token |

---

## 🎨 Design System

The Aurora design system uses CSS custom properties defined in `tokens.css`:

- **Colors:** Deep void background (`#0D0B12`), aurora teal/violet/rose accents, gold highlights
- **Typography:** `Cormorant Garamond` (display) + `Inter` (body) + `JetBrains Mono` (mono)
- **Spacing:** 4px-base scale (`--sp-1` to `--sp-20`)
- **Animation:** Physics-based vinyl spin via `requestAnimationFrame` (no CSS `animation` property)

---

## 🌍 Deployment

### Vercel (Production)

1. Connect the GitHub repo to [Vercel](https://vercel.com)
2. Add environment variables in **Project Settings → Environment Variables**:
   - `DATABASE_URL` — Supabase connection pooler string
   - `JWT_SECRET` — Long random secret
3. Deploy — Vercel automatically runs `npm run build` and routes `/api/*` to the serverless function

### Supabase (Database)

- Project: `groove-and-co`
- Region: Southeast Asia (Singapore)
- Connection: Transaction Pooler on port `6543` (required for serverless)

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite frontend dev server |
| `npm run server` | Start Express backend on port 4000 |
| `npm run build` | Build frontend for production |
| `npm run db:setup` | Apply schema to PostgreSQL |
| `npm run db:seed-real` | Seed 58+ real albums from iTunes API |

---

## 🔐 Security Notes

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWTs expire after **7 days**
- `.env` is gitignored — never committed
- Supabase uses **Row Level Security** (can be enabled per table)
- Protected routes redirect unauthenticated users to `/login` with return URL preserved

---

## 📄 License

MIT © 2026 Groove & Co.
