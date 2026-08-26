# Groove & Co.

A React + Express + PostgreSQL album ecommerce project.

## Local setup

1. Create a PostgreSQL database named `groove_and_co`.
2. Copy `.env.example` to `.env`.
3. Replace the connection string with your PostgreSQL username and password.
4. Install dependencies:

```powershell
npm install
```

5. Create tables and seed the catalog:

```powershell
npm run db:setup
```

6. Start the backend in one terminal:

```powershell
npm run server
```

7. Start the frontend in another terminal:

```powershell
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and the API at `http://localhost:4000`.

## Current API

- `GET /api/health`
- `GET /api/products?search=&genre=&format=`
- `GET /api/products/:productId`
- `POST /api/orders`

The server uses PostgreSQL transactions for order creation and protects prices and inventory on the server. Payments, authentication, shipping providers, and secure downloads are intentionally left for later.
