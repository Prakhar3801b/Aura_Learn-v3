# Aura Learn V3 🎓✨

> **The unified AI study engine** — upload any study material, get targeted exam points, predictive flashcards, interactive mind maps, and WebXR AR labs. Backed by real-time comprehension analytics.

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, React Flow |
| **Background** | Vanta.js Globe (blue/black, all pages) |
| **Backend** | FastAPI (Python 3.11), Uvicorn |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI** | Groq API (Llama 3.3 70B), OpenAI Whisper (local), Tesseract OCR |
| **AR** | A-Frame 1.5, WebXR Device API |

## AR Labs (7 Total)

- **Physics**: Simple Pendulum · Circuit Board · Optics Bench
- **Chemistry**: Acid-Base Titration · Molecular Bond Builder
- **Biology**: Cell Division (Mitosis) · DNA Double Helix & Replication

---

## Quick Setup

### 1. Prerequisites

- Node.js 18+
- Python 3.11+
- [ffmpeg](https://ffmpeg.org/download.html) (for Whisper video transcription)
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) (Windows installer)
- Supabase account (free): [supabase.com](https://supabase.com)
- Groq API key (free): [console.groq.com](https://console.groq.com)

### 2. Database Setup (Supabase)

1. Create a new Supabase project
2. Go to **SQL Editor** and run these migrations **in order**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_vector_store.sql`
   - `supabase/migrations/003_analytics.sql`
3. Go to **Storage** → Create bucket named `study-materials` (public)

### 3. Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Fill in your values in `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq (free at console.groq.com)
GROQ_API_KEY=gsk_...

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

Copy `.env` into both `frontend/.env.local` and `backend/.env`.

### 4. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Visit **http://localhost:8000/docs** to verify all routes in Swagger UI.

### 5. Frontend

```bash
cd frontend

# Install dependencies (already done during scaffold)
npm install

# Run dev server
npm run dev
```

Visit **http://localhost:3000** — you should see the landing page with the Vanta.js Globe.

---

## Project Structure

```
Aura_learn V3/
├── frontend/                      # Next.js 14
│   ├── app/
│   │   ├── page.tsx               # Landing page (Vanta Globe + hero)
│   │   ├── login/page.tsx         # Auth
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx     # Materials hub
│   │   ├── upload/page.tsx        # Drag-drop upload
│   │   ├── study/[id]/page.tsx    # 3-panel: MindMap | Flashcards | Exam Points
│   │   ├── focus/[id]/page.tsx    # Distraction-free Focus Mode
│   │   └── ar-labs/
│   │       ├── page.tsx           # AR Labs catalog
│   │       └── [id]/page.tsx      # A-Frame WebXR lab
│   ├── components/
│   │   ├── VantaBackground.tsx    # Vanta Globe (fixed, all pages)
│   │   ├── Navbar.tsx
│   │   ├── MindMap.tsx            # React Flow interactive graph
│   │   ├── Flashcards.tsx         # 3D flip cards + confidence tracking
│   │   └── ExamPoints.tsx         # Topic-filtered exam points
│   └── lib/
│       ├── supabase.ts            # Supabase client
│       └── api.ts                 # FastAPI client
│
├── backend/                       # FastAPI
│   ├── main.py                    # Entry point, CORS, routes
│   ├── config.py                  # pydantic-settings
│   ├── routes/
│   │   ├── materials.py           # Upload + background AI processing
│   │   ├── ai.py                  # Flashcards, exam points, mind map endpoints
│   │   ├── analytics.py           # Session events + anomaly detection
│   │   └── xr.py                  # 7 AR lab definitions
│   ├── services/
│   │   ├── ai_service.py          # Groq / Llama 3.3 pipeline
│   │   ├── whisper_service.py     # Local Whisper transcription + timestamps
│   │   ├── ocr_service.py         # Tesseract OCR
│   │   ├── pdf_service.py         # PDF extraction + chunking
│   │   └── analytics_service.py   # Anomaly detection engine
│   └── models/                    # Pydantic schemas
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # Core tables
│       ├── 002_vector_store.sql   # pgvector
│       └── 003_analytics.sql      # Events + anomalies
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Key Features

### AI Pipeline
1. **PDF** → `pdfplumber` extracts text → chunked for pgvector  
2. **Image** → Tesseract OCR extracts handwritten text  
3. **Video** → local Whisper transcribes with timestamps  
4. All → Groq Llama 3.3 generates flashcards, exam points, mind map  
5. Mind map nodes auto-linked to video timestamps when available

### Analytics & Anomaly Detection
- Every study action is recorded (`wrong_answer`, `pause`, `re-read`)
- 3 anomaly triggers: repeated errors, stuck-on-topic pauses, comprehension drops
- Interventions: `simplify_content`, `suggest_ar_lab`, `add_flashcard`
- Comprehension score updated in real-time in Supabase

### WebXR AR Labs
- 7 labs running entirely in-browser via A-Frame 1.5 + WebXR API
- Surface hit-test places experiments on real desk/floor
- Best on Chrome for Android; iOS WebXR support is limited

---

## Running with Docker

```bash
# At project root
cp .env.example .env  # Fill in your keys
docker-compose up --build
```

---

## Notes

- **Whisper model size**: Set `WHISPER_MODEL=base` for speed, `medium` for accuracy
- **pgvector**: Must be enabled in Supabase SQL editor (done by migration 002)
- **Tesseract**: Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) on Windows
- **ffmpeg**: Required for Whisper video processing — [download here](https://ffmpeg.org/download.html)
