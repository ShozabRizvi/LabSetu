# 🚀 LabSetu Backend Reference Server

This is the ready-to-run reference backend server for **LabSetu**. It provides full REST API implementations for all citizen and authority frontend flows.

---

## ⚡ Quick Start (Run in 1 Minute)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` values:
```env
PORT=5000
JWT_SECRET=labsetu_jwt_secret_dev_key_2026
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Start Server
```bash
npm run dev
# or: npm start
```
The server will start at:
`http://localhost:5000/api`

---

## 🔌 Connecting to Frontend

1. Ensure `frontend/.env` has:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```
2. In the frontend directory, start Vite:
```bash
npm run dev
```
3. Open `http://localhost:5173` — the frontend will now automatically communicate with your backend API!

---

## 🗄️ Database Integration

Currently, `server.js` uses an in-memory seed data structure for instant testing. You can easily plug in:
- **MongoDB / Mongoose**: Replace `db.users` etc. with Mongoose models.
- **PostgreSQL / Prisma / TypeORM / Sequelize**: Map the endpoints to SQL queries.
- **Supabase / Firebase**: Call your BaaS client inside the route handlers.

For detailed request/response schemas, check [BACKEND_INTEGRATION_GUIDE.md](../BACKEND_INTEGRATION_GUIDE.md).
