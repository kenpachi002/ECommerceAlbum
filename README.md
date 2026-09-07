# Groove & Co.

> A curated vinyl shop for records worth returning to.

Groove & Co. is a full-stack record store built with React, Express, PostgreSQL, and Vercel. Browse a seeded catalog, search the wider iTunes archive, manage a wishlist, place orders, track delivery, and manage inventory from the admin dashboard.

## Highlights

- Premium Aurora + Stitch interface with responsive layouts and animated record artwork
- PostgreSQL-backed catalog, accounts, orders, wallets, and delivery tracking
- JWT authentication with bcrypt password hashing and protected routes
- Search across the local catalog or the iTunes album archive
- Cart, checkout, wallet payments, order history, cancellation, and delivery due dates
- Admin tools for users, balances, inventory, order status, and delivery dates
- Vercel-ready frontend and Express serverless API

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, React Router, Vite |
| Backend | Express 5, Node.js |
| Database | PostgreSQL via Supabase |
| Authentication | JWT, bcrypt |
| Styling | Vanilla CSS, Lucide React |
| Deployment | Vercel |

## Run Locally

### Requirements

- Node.js 18+
- PostgreSQL or a Supabase project

### Setup

```bash
npm install
```

Create `.env` from `.env.example` and set:

```env
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-long-random-secret
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Initialize the database:

```bash
npm run db:setup
npm run db:migrate
npm run db:seed-real
```

Start the application in two terminals:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run server` | Start the Express API on port 4000 |
| `npm run build` | Create a production frontend build |
| `npm run db:setup` | Apply the base schema and seed data |
| `npm run db:migrate` | Apply safe schema updates |
| `npm run db:seed-real` | Seed curated album data and artwork |

## Project Shape

```text
api/                 Vercel serverless entry point
server/              Express API, database schema, migrations, seeders
src/app/             Routes and application shell
src/components/      Catalog, cart, layout, product, and order UI
src/features/        Auth, cart, and wishlist state
src/pages/           Catalog, checkout, account, admin, and order pages
src/lib/             Shared API client
src/styles/          Design tokens and component styles
```

## Deployment

Deploy the project through Vercel and configure these environment variables in the project settings:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `RESEND_API_KEY` for password reset email delivery

The Vercel configuration routes `/api/*` to the Express serverless entry point and sends all other routes to the React application.

## Notes

- Wallet deposits are currently application-level demo credits, not a live payment gateway.
- iTunes search results are for discovery; only records with a database variant can be purchased.
- Never commit `.env` or production secrets.

## License

MIT © 2026 Groove & Co.
