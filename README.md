# HomeServe AI - Full Stack Platform

HomeServe AI Dashboard with Python FastAPI backend and React 19 + TypeScript frontend.

## 🚀 How to Run

### 1. Start the Backend (FastAPI + SQLite)
Ensure Python dependencies are installed:
```bash
pip install -r backend/requirements.txt
```

Run the server (runs at `http://localhost:8000`):
```bash
npm run server
# or directly:
python -m uvicorn backend.main:app --reload --port 8000
```
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Start the Frontend (Vite + React)
In another terminal:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🛠 Backend Architecture

- **Framework**: FastAPI (Python)
- **Database**: SQLite via SQLAlchemy ORM (`backend/app.db`)
- **Validation**: Pydantic v2 schemas
- **Data Seeding**: Automatic initial seed on startup (`backend/seed.py`)

### API Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/api/calls` | GET, POST | List & create call logs with transcripts |
| `/api/calls/{id}` | GET, DELETE | Fetch or delete specific call |
| `/api/leads` | GET, POST | List & create qualified leads |
| `/api/leads/{id}` | GET, PATCH, DELETE | Update lead status, score, or notes |
| `/api/bookings` | GET, POST | Calendar bookings & technician assignments |
| `/api/bookings/{id}` | GET, PATCH, DELETE | Update appointment status |
| `/api/webhooks/voice` | POST | Universal inbound Voice AI webhook (Retell, Bland, Twilio) |
| `/api/webhooks/vapi` | POST | Native Vapi.ai end-of-call report webhook |
| `/api/webhooks/simulate` | POST | Playground to simulate AI calls with auto lead scoring |
| `/api/sms/templates` | GET, POST | List & create SMS automation templates |
| `/api/sms/templates/{id}` | PATCH, DELETE | Update or delete SMS template |
| `/api/sms/send` | POST | Trigger outgoing SMS dispatch |
| `/api/settings` | GET, PUT | Voice AI, business hours, & qualification settings |
| `/api/metrics` | GET | Aggregated dashboard stats & chart metrics |
| `/api/auth/login` | POST | User sign in with JWT token issuance |
| `/api/auth/register` | POST | Register new business user account |
| `/api/auth/me` | GET | Current authenticated user profile |
| `/ws` | WebSocket | Real-time broadcast for live inbound calls, emergencies, and bookings |
