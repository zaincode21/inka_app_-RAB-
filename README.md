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

Same flow as the asset-audit mobile app:

```sh
cd frontend
npm install
npm start
# or
npx expo start
```

Then on device / emulator:

- **Android**: scan the QR code with Expo Go, or `npm run android`
- **iOS**: scan with Camera / Expo Go, or `npm run ios`
- **Web**: `npm run web`

Phone and PC must be on the **same Wi‑Fi**. Leave `EXPO_PUBLIC_API_BASE_URL` empty so the app picks the Expo host (or falls back to your LAN IP):

```sh
EXPO_PUBLIC_API_BASE_URL=""
```

API URL on a physical phone is effectively `http://YOUR_LAN_IP:4000/api/v1` (not `localhost`).  
If your PC IP changes, update `FALLBACK_LAN_HOST` in `frontend/data/apiClient.ts` (`hostname -I`).

If Expo Go times out connecting to Metro, open ports on the PC:

```sh
sudo iptables -I INPUT -p tcp --dport 8081 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
```
