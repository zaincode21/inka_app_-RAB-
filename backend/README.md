# Inka Backend API

Custom REST backend for the Inka farm management app. It uses Node.js, Express, TypeScript, Prisma 7, and PostgreSQL.

## Setup

1. Install dependencies:

```sh
npm install
```

2. Create an environment file:

```sh
cp .env.example .env
```

3. Make sure PostgreSQL is installed and running, then create a database and user that match your `.env` file. For the default `.env.example` values, you can create them with:

```sh
sudo -u postgres psql
CREATE USER inka WITH PASSWORD 'inka_password';
CREATE DATABASE inka OWNER inka;
\q
```

If you already have PostgreSQL credentials, update `DATABASE_URL` in `.env` instead.

4. Validate and create the database schema:

```sh
npm run prisma:validate
npm run prisma:migrate
npm run seed
```

5. Start development server:

```sh
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Scripts

- `npm run dev`: run the backend in watch mode.
- `npm run build`: compile TypeScript into `dist/`.
- `npm run start`: run the compiled server.
- `npm run typecheck`: validate TypeScript without emitting files.
- `npm run prisma:validate`: validate Prisma schema.
- `npm run prisma:generate`: generate Prisma client.
- `npm run prisma:migrate`: run Prisma migrations in development.
- `npm run seed`: seed default farm categories.

## API Routes

All business routes are under `/api/v1`.

- `GET /health` and `GET /api/v1/health`: service status.
- `/api/v1/farms`: farm profile records.
- `/api/v1/categories`: configurable breeds, groups, medicines, event types, income categories, expense categories, and milk destinations.
- `/api/v1/cattle`: professional cattle identity, lifecycle, production, and lineage records.
- `/api/v1/milk-records`: milk production, usage, rejected milk, destinations, buyer, price, and quality records.
- `/api/v1/events`: individual and mass veterinary, breeding, pregnancy, birth, weighing, vaccination, treatment, and deworming events.
- `/api/v1/transactions`: income and expense records with category, amount, quantity, unit price, buyer/vendor, payment, receipt, tax, discount, and resource links.
- `/api/v1/reports/dashboard`: dashboard metrics.
- `/api/v1/reports/summaries`: report summary cards.

Most resource routes support:

- `GET /`: list records.
- `GET /:id`: read one record.
- `POST /`: create a record.
- `PATCH /:id`: update a record.

## Notes

- This backend phase does not connect the Expo app to the API yet.
- The Prisma config includes a local fallback database URL only so schema validation works before `.env` is created.
- Use uppercase enum values in API payloads, such as `MALE`, `FEMALE`, `COW`, `ACTIVE`, `INDIVIDUAL`, `MASS`, `INCOME`, and `EXPENSE`.
