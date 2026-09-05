# INFINEON Enterprise Platform — Run Doc

## How to Reproduce Artifacts
1. Frontend dependencies are already installed at `frontend/node_modules/`
2. The Go binary is pre-built at `bin/infineon.exe`

## How to Run

### Option A: Frontend + Backend (Full Stack)
1. Start the Go backend in demo mode:
   ```
   cd "C:\Users\LENOVO\Documents\Special Project"
   bin\infineon.exe serve --demo --port 3001
   ```
2. Start the Vite dev server (already configured to proxy /api to port 3001):
   ```
   cd frontend
   npm run dev
   ```
3. Open http://localhost:5173
4. Login: admin@infineon.com / admin123

### Option B: Backend Only (API Testing)
```
cd "C:\Users\LENOVO\Documents\Special Project"
bin\infineon.exe serve --demo --port 3001
```
API available at http://localhost:3001/api/v1/

## Server Details
- **Go Backend**: SQLite demo mode (no PostgreSQL required)
- **Database**: infineon_demo.db (auto-created with 53 tables, seed data)
- **Frontend**: React + Vite dev server on port 5173
- **API Proxy**: Vite proxies /api/* to Go backend on port 3001
- **Demo Data**: 50-room Grand Palm Hotel Lagos, 20 guests, 27 menu items, 25 products, 15 employees
