# Groove & Co.

A curated record store built with React, Node.js, and PostgreSQL.

## Local development

Requirements: Node.js 18+, npm, and a local PostgreSQL installation.

1. Install packages:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env`. Fill in the database connection values for your private hosted and/or local databases, and set a private `JWT_SECRET`. Never commit `.env`.
3. Prepare the local database:

   - Existing database: `npm run db:migrate:local`
   - New database: `npm run db:setup:local`, then `npm run db:migrate:local`
   - Optional sample album import: `npm run db:seed-real:local`

4. Start the API and site in separate terminals:

   ```powershell
   npm run server
   ```

   ```powershell
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173).

When developing locally, the app uses the hosted database when available and can use the configured local database if the hosted one is unavailable. Changes made while using the local database are separate from hosted data. The admin inventory screen includes a review-and-confirm action for reconciling stock.

## Hosted deployment

The deployed application uses a persistent hosted PostgreSQL database. A database running on a developer's computer is not used by the deployed site.

1. Configure a hosted PostgreSQL database.
2. Set `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` in the hosting provider's private environment settings. Set `RESEND_API_KEY` if email delivery is enabled. Do not set local database credentials in hosted settings.
3. Prepare the hosted database before release:

   - Existing database: `npm run db:migrate`
   - New database: `npm run db:setup`, then `npm run db:migrate`

4. Deploy the application.

Keep database credentials and signing secrets out of source control. Back up production data regularly. Review environment settings before publishing changes.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local frontend |
| `npm run server` | Start the local API |
| `npm run build` | Build the frontend for deployment |
| `npm run db:setup` | Create the base schema using `DATABASE_URL` |
| `npm run db:migrate` | Apply database updates using `DATABASE_URL` |
| `npm run db:seed-real` | Import sample albums using `DATABASE_URL` |
| `npm run db:setup:local` | Create the base schema using `LOCAL_DATABASE_URL` |
| `npm run db:migrate:local` | Apply database updates using `LOCAL_DATABASE_URL` |
| `npm run db:seed-real:local` | Import sample albums using `LOCAL_DATABASE_URL` |

## Notes

- Payment and wallet features are for demonstration and are not a live payment service.
- Music search results are for discovery; only items in the store catalog are purchasable.
- Keep `.env` private and never paste credentials into issues, chats, or public repositories.

## License

MIT © 2026 Groove & Co.
