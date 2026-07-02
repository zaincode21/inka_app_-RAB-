# Inka

Inka is split into two independent projects:

- `frontend/`: Expo mobile/web app.
- `backend/`: Express, Prisma, and PostgreSQL API.

## Run The Backend

```sh
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

The backend runs on `http://localhost:4000` by default.

## Run The Frontend

```sh
cd frontend
npm install
npx expo start -c
```

For a physical phone, set `EXPO_PUBLIC_API_BASE_URL` in `frontend/.env` to your computer's LAN IP:

```sh
EXPO_PUBLIC_API_BASE_URL="http://192.168.1.71:4000/api/v1"
```

Both devices must be on the same network.
