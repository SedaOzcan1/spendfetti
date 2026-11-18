# Spendfetti 🎉

> **spend + confetti** — Harcamalarını takip et, artan paranı kutla ve eğlenceye dönüştür.

Node.js + Express + MongoDB API ve React + Vite istemcisinden oluşan full stack harcama takip uygulaması.

## Yapı

```
spendfetti/
├── server/   # Express (ES Modules), Mongoose, Zod, JWT
└── client/   # React + Vite, TanStack Query, Tailwind, Chart.js, canvas-confetti
```

## Gereksinimler

- Node.js 24 (`nvm use`)
- MongoDB (yerel ya da Atlas)

## Kurulum

```bash
nvm use
npm install
cp server/.env.example server/.env   # değerleri düzenle

npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (/api → 4000 proxy)
```

## Komutlar

| Komut            | Açıklama                          |
| ---------------- | --------------------------------- |
| `npm run lint`   | ESLint (tüm repo)                 |
| `npm run format` | Prettier                          |
| `npm test`       | Server + client testleri (Vitest) |
| `npm run build`  | Client production build           |

## Yol haritası

- [x] T1 Monorepo iskeleti
- [x] T2 CI (GitHub Actions)
- [ ] T3 Veritabanı modelleri
- [ ] T4 Auth API
- [ ] T5 İşlem ve kategori API'si
- [ ] T6 Özet API'si
- [ ] T7 API testleri
- [ ] T8 Frontend
- [ ] T9 Deploy ve README
- [ ] T10 Eğlence bütçesi API'si
- [ ] T11 Etkinlik API'si
- [ ] T12 Popup ve Aktiviteler ekranı
- [ ] T13 Konfeti efektleri
