# Spendfetti 🎉

> **spend + confetti** — Track your spending, celebrate what you save, and turn it into fun.

A full stack expense tracker: a Node.js + Express + MongoDB API and a React + Vite client.

## Structure

```
spendfetti/
├── server/   # Express (ES Modules), Mongoose, Zod, JWT
└── client/   # React + Vite, TanStack Query, Tailwind, Chart.js, canvas-confetti
```

## Requirements

- Node.js 24 (`nvm use`)
- MongoDB is **optional** — the default `MONGODB_URI=memory` starts an in-memory MongoDB (data is wiped on restart). For persistent data, set a local MongoDB or Atlas connection string in `server/.env`.

## Getting started

```bash
nvm use
npm install
cp server/.env.example server/.env

npm run dev   # API + client together
```

- Client: http://localhost:5173 (`/api` requests are proxied to port 4000)
- API: http://localhost:4000/api/health

To run them separately: `npm run dev:server`, `npm run dev:client`.

## Scripts

| Script           | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start API + client together    |
| `npm run lint`   | ESLint (whole repo)            |
| `npm run format` | Prettier                       |
| `npm test`       | Server + client tests (Vitest) |
| `npm run build`  | Client production build        |

## Roadmap

- [x] T1 Monorepo scaffold
- [x] T2 CI (GitHub Actions)
- [ ] T3 Database models
- [ ] T4 Auth API
- [ ] T5 Transactions & categories API
- [ ] T6 Summary API
- [ ] T7 API integration tests
- [ ] T8 Frontend
- [ ] T9 Deploy & README
- [ ] T10 Fun budget API
- [ ] T11 Events API
- [ ] T12 Fun budget prompt & Activities page
- [ ] T13 Confetti effects
