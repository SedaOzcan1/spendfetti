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
- MongoDB **gerekmez** — varsayılan `MONGODB_URI=memory` bellek içi bir MongoDB başlatır (veriler yeniden başlatınca silinir). Kalıcı veri için `server/.env` içinde yerel MongoDB ya da Atlas adresini verin.

## Kurulum

```bash
nvm use
npm install
cp server/.env.example server/.env

npm run dev   # API + arayüz birlikte
```

- Arayüz: http://localhost:5173 (`/api` istekleri 4000'e proxy'lenir)
- API: http://localhost:4000/api/health

Ayrı ayrı çalıştırmak için: `npm run dev:server`, `npm run dev:client`.

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
