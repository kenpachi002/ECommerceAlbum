<div align="center">

# Groove & Co.

### A record store for the albums that stay with you.

Curated pressings, considered artwork, and a little room to dig.

<br />

![React](https://img.shields.io/badge/React-18-149ECA?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-43853D?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## The listening room

Groove & Co. is a full-stack record shop made for browsing as much as buying. Explore the store catalog, search a wider music archive, save records for later, and manage the shop from a dedicated admin dashboard.

| Discover | Shop | Manage |
| --- | --- | --- |
| Browse curated albums and artwork | Cart, checkout, and order history | Inventory and stock controls |
| Search the Apple/iTunes music archive | Wishlist and customer accounts | Users, orders, and delivery updates |

### Built with

**React · Vite · Express · PostgreSQL · Supabase · Vercel · Lucide**

---

## Run it on your machine

### You’ll need

- Node.js 18 or newer
- npm
- PostgreSQL

### 1 · Install dependencies

```powershell
npm install
```

### 2 · Set up private environment values

Copy `.env.example` to `.env`. Set the database connection values for your private hosted and/or local databases, and provide a private `JWT_SECRET`. Keep `.env` out of source control.

### 3 · Prepare your local database

| Starting point | Commands |
| --- | --- |
| Existing database | `npm run db:migrate:local` |
| Brand-new database | `npm run db:setup:local` then `npm run db:migrate:local` |
| Add the optional album seed | `npm run db:seed-real:local` |

### 4 · Start the API and frontend

Use two terminals in the project folder:

**Terminal 1 — API**

```powershell
npm run server
```

**Terminal 2 — frontend**

```powershell
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

### Local database behavior

When you run locally, the app uses the hosted database when it is reachable and can fall back to your configured local PostgreSQL when it is not. The admin dashboard shows which database is active. Changes made while using the local database stay local until you review and confirm an inventory sync.

---

## Deploy the hosted store

The deployed application uses a persistent hosted PostgreSQL database. It does not connect to PostgreSQL running on your computer.

### 1 · Configure the hosted database

Create or resume your hosted PostgreSQL database and keep its connection details private.

### 2 · Prepare the database

Run these commands from the project folder, with `DATABASE_URL` set to your hosted connection:

| Starting point | Commands |
| --- | --- |
| Existing database | `npm run db:migrate` |
| Brand-new database | `npm run db:setup` then `npm run db:migrate` |

### 3 · Configure deployment environment

Add `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` to the hosting provider’s private environment settings. To send password-reset email, also set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to an address on a domain verified with your email provider. The default test sender is not intended for general customer delivery. Do not add local database credentials to hosted settings.

### 4 · Deploy

Deploy the application. The hosted database is the shared source for customer and admin activity on the live site.

> **Keep it safe:** never commit credentials or signing secrets. Back up production data regularly and review deployment environment settings before publishing.

---

## Command shelf

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run server` | Start the local API |
| `npm run build` | Build the frontend for deployment |
| `npm run db:setup` | Create the base schema using `DATABASE_URL` |
| `npm run db:migrate` | Apply database updates using `DATABASE_URL` |
| `npm run db:seed-real` | Import sample albums using `DATABASE_URL` |
| `npm run db:setup:local` | Create the base schema using `LOCAL_DATABASE_URL` |
| `npm run db:migrate:local` | Apply database updates using `LOCAL_DATABASE_URL` |
| `npm run db:seed-real:local` | Import sample albums using `LOCAL_DATABASE_URL` |

---

## A few notes

- Wallet balances are demo credits, not a live payment service.
- Music search is for discovery; only records in the store catalog are purchasable.
- Keep `.env` private. Never paste credentials into public issues, chats, or repositories.

<div align="center">

Made for listening closely.
**MIT © 2026 Groove & Co.**

</div>
