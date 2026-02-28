# 🌟 Lumina — Turning Learning Differences into Learning Superpowers

> An AI-powered, gamified learning platform for children with dyslexia. Through a jungle adventure across five islands, kids learn to read with structured literacy — no timers, no pressure — guided by **Leo the Lion**, who cheers them on every step of the way.

---

## 🦁 What is Lumina?

Lumina believes every child learns differently — and every child can win.

Built for children with dyslexia and other learning differences, Lumina transforms structured literacy into a joyful jungle adventure. Kids earn Sun Coins, unlock islands, build streaks, and grow their reading skills at their own pace — while parents and teachers track real progress from a dedicated adult dashboard.

---


> *"Reading feels like an adventure."* — Lumina's welcoming home screen for children aged 5–7.

</div>

---

## ✨ Features

### 👦 For Learners (Children)
- **Emoji PIN login** — no passwords, just 4 fun emojis to tap
- **Jungle island adventure** — 5 themed islands, each targeting a different literacy skill
- **Leo the Lion mascot** — AI-powered guide who gives encouragement and hints
- **Sun Coins & rewards** — earn coins for completing activities, maintain daily streaks
- **No timers, no pressure** — self-paced learning designed for neurodiverse kids
- **Onboarding flow** — pick interests, set consent preferences, personalise the experience
- **Forgot PIN flow** — reset emoji PIN in seconds without adult help

### 👩‍🏫 For Adults (Teachers & Parents)
- **Email + password login** with show/hide password toggle
- **Adult dashboard** — view all linked students, track progress across islands
- **Student activity logs** — see scores, time spent, phoneme errors, coins earned
- **Role-based accounts** — separate teacher and parent roles
- **Forgot password flow** — inline password reset without leaving the app

### 🏝️ Learning Islands
| Island | Focus Area |
|--------|-----------|
| Island 1 | Phonemic Awareness |
| Island 2 | Letter-Sound Correspondence |
| Island 3 | Blending & Decoding |
| Island 4 | Sight Words |
| Island 5 | Reading Fluency |

### 📊 Progress Tracking
- Per-activity scores (correct answers, total questions, time spent)
- Phoneme error tracking for targeted support
- Island-by-island progress breakdown
- Daily streak system with automatic updates
- Sun Coins economy with award history

---

## 🏗️ System Architecture

### Architecture Overview

```
╔══════════════════════════════════════════════════════════════════════════╗
║                        FRONTEND  (React + Vite)                         ║
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │  React App                                                       │    ║
║  │  ├── render Leo ──► Leo Avatar (Lottie animation)               │    ║
║  │  │                                                               │    ║
║  │  ├── navigate ───► PHONICS ISLANDS                              │    ║
║  │  │                  ├── Island 1: Phonological Awareness         │    ║
║  │  │                  ├── Island 2: CVC Words                      │    ║
║  │  │                  ├── Island 3: Digraphs & Blends              │    ║
║  │  │                  ├── Island 4: Long Vowels & Vowel Teams      │    ║
║  │  │                  └── Island 5: Multisyllabic Mastery          │    ║
║  │  │                       └── Activities per island:             │    ║
║  │  │                            ├── 🃏 Flash Cards                 │    ║
║  │  │                            ├── 🔀 Word Sort                   │    ║
║  │  │                            ├── 🧩 Blending                    │    ║
║  │  │                            ├── 👂 Listen & Find               │    ║
║  │  │                            └── ✏️  Spell It                   │    ║
║  │  │                                                               │    ║
║  │  ├── navigate ───► LEARNING COVE                                │    ║
║  │  │                  ├── A–Z Letters (See, Hear, Speak loop)      │    ║
║  │  │                  └── 1–10 Numbers (zoom, count, echo)         │    ║
║  │  │                                                               │    ║
║  │  └── navigate ───► KINESTHETIC LEARNING                         │    ║
║  │                     └── Camera Tracing Game (dot-matrix letters) │    ║
║  └─────────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════════╝
         │  REST calls                           │  voice input
         │  Leo speaks ──────────────────────►   │  word pronunciation
         ▼                                        ▼
╔═══════════════════════════════╗    ╔═══════════════════════════════╗
║      SPEECH SERVICES          ║    ║      SPEECH SERVICES          ║
║                               ║    ║                               ║
║  ┌───────────────────────┐    ║    ║  ┌───────────────────────┐   ║
║  │    Web Speech API     │    ║    ║  │      Echo-Mic         │   ║
║  │  (speechSynthesis)    │    ║    ║  │  (SpeechRecognition)  │   ║
║  │                       │    ║    ║  │                       │   ║
║  │  • Leo TTS narration  │    ║    ║  │  • Child speaks word  │   ║
║  │  • Letter phonics     │    ║    ║  │  • Matches to target  │   ║
║  │  • Word pronunciation │    ║    ║  │  • ✅ Star animation   │   ║
║  │  • Hints & praise     │    ║    ║  │  • ❌ Mouth-shape GIF  │   ║
║  └───────────────────────┘    ║    ║  └───────────────────────┘   ║
╚═══════════════════════════════╝    ╚═══════════════════════════════╝
                                           │  echo-mic feedback
                                           ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                         BACKEND  (Express + TypeScript)                  ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │                        API GATEWAY                               │   ║
║  │                   /api  (Express Router)                         │   ║
║  └────────────────────┬──────────────────┬──────────────────────────┘   ║
║                       │                  │                  │            ║
║           ┌───────────▼──┐    ┌──────────▼──────┐  ┌───────▼────────┐  ║
║           │ AUTH SERVICE │    │ PROGRESS SERVICE│  │STUDENT SERVICE │  ║
║           │              │    │                 │  │                │  ║
║           │ POST /child  │    │ POST /activity  │  │ GET /dashboard │  ║
║           │   /signup    │    │ GET  /island/:id│  │ GET /profile   │  ║
║           │ POST /child  │    │ POST /coins     │  │ PUT /onboarding│  ║
║           │   /login     │    │                 │  │ POST /session  │  ║
║           │ POST /child  │    │  ┌───────────┐  │  │   /start       │  ║
║           │   /reset-pin │    │  │ Scores &  │  │  │ PUT /session   │  ║
║           │ POST /adult  │    │  │ Streaks   │  │  │   /end         │  ║
║           │   /signup    │    │  │ (Supabase)│  │  │                │  ║
║           │ POST /adult  │    │  └───────────┘  │  │  ┌──────────┐  │  ║
║           │   /login     │    │                 │  │  │ Profiles │  │  ║
║           │ POST /adult  │    │  link scores ───┼──┼─►│(Supabase)│  │  ║
║           │  /reset-pass │    │  to student     │  │  └──────────┘  │  ║
║           │              │    └─────────────────┘  └────────────────┘  ║
║           │  ┌─────────┐ │                                              ║
║           │  │  User   │ │                                              ║
║           │  │  Creds  │ │                                              ║
║           │  │(Supabase│ │                                              ║
║           │  │  Auth)  │ │                                              ║
║           │  └─────────┘ │                                              ║
║           └──────────────┘                                              ║
╚══════════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════════╗
║                      SUPABASE  (PostgreSQL + Auth)                       ║
║                                                                          ║
║  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  ║
║  │   child_profiles   │  │   adult_profiles   │  │ island_progress  │  ║
║  ├────────────────────┤  ├────────────────────┤  ├──────────────────┤  ║
║  │ id (uuid PK)       │  │ id (uuid PK)       │  │ student_id       │  ║
║  │ user_id            │  │ user_id            │  │ island_id        │  ║
║  │ name               │  │ full_name          │  │ best_score       │  ║
║  │ emoji_pin          │  │ role               │  │ completed        │  ║
║  │ auth_email         │  │ (teacher/parent)   │  └──────────────────┘  ║
║  │ auth_password      │  └────────────────────┘                        ║
║  │ avatar             │                          ┌──────────────────┐  ║
║  │ sun_coins          │                          │  activity_logs   │  ║
║  │ streak_days        │                          ├──────────────────┤  ║
║  │ last_active_date   │                          │ student_id       │  ║
║  │ onboarding_done    │                          │ island_id        │  ║
║  └────────────────────┘                          │ activity_type    │  ║
║                                                  │ score            │  ║
║                                                  │ time_spent_sec   │  ║
║                                                  │ phoneme_errors   │  ║
║                                                  │ coins_earned     │  ║
║                                                  └──────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Data Flow Summary

| Flow | From | To | Data |
|------|------|----|------|
| Child login | React App | Auth Service → Supabase Auth | name + emoji PIN → session token |
| Adult login | React App | Auth Service → Supabase Auth | email + password → session token |
| Reset child PIN | React App | Auth Service → Supabase | new emoji PIN → updates auth + profile |
| Reset adult pass | React App | Auth Service → Supabase Auth | email + new password |
| Leo speaks | React App | Web Speech API (TTS) | text → spoken audio |
| Echo-Mic input | Child microphone | Web Speech Recognition | audio → text → ✅/❌ feedback |
| Word pronunciation | Phonics Islands | Web Speech API | letter/word → phonics sound |
| Save activity | Phonics Islands | Progress Service → Supabase | score, time, phoneme errors |
| Save tracing | Kinesthetic Learning | Progress Service → Supabase | tracing accuracy % |
| Save module | Learning Cove | Progress Service → Supabase | letter/number mastery |
| Link scores | Progress Service | Student Service → Supabase | scores linked to student profile |
| Dashboard load | React App | Student Service → Supabase | coins, streaks, island progress |
| Award coins | Any activity | Progress Service → Supabase | amount + reason |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | CSS-in-JS (inline styles), Google Fonts (Lexend + Fraunces) |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (admin SDK) |
| Dev server | ts-node-dev |

---

## 📁 Project Structure

```
Lumina/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   │   ├── Login.tsx      # Child + adult login with forgot flows
│   │   │   ├── Signup.tsx     # Child + adult signup
│   │   │   ├── Onboarding.tsx # New learner setup
│   │   │   └── Dashboard.tsx  # Student / adult dashboard
│   │   ├── lib/
│   │   │   └── api.ts         # Central API client (all backend calls)
│   │   └── main.tsx
│   ├── .env                   # VITE_API_URL
│   └── package.json
│
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts        # All auth routes (login, signup, reset)
│   │   │   ├── student.ts     # Dashboard, profile, sessions
│   │   │   └── progress.ts    # Activity saving, coins, island progress
│   │   ├── lib/
│   │   │   └── supabaseAdmin.ts  # Supabase admin client
│   │   └── index.ts           # Express app entry point
│   ├── .env                   # PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
│   └── package.json
│
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- A [Supabase](https://supabase.com) project

---

### 1. Clone the repository

```bash
git clone https://github.com/supriyamulik/Lumina-Turning-Learning-Differences-into-Learning-Superpowers.git
cd Lumina-Turning-Learning-Differences-into-Learning-Superpowers
```

---

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ **Never commit your `.env` file.** The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges.

Start the backend dev server:

```bash
npm run dev
```

You should see:
```
🦁 Lumina backend running on port 4000
```

---

### 3. Set up the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:4000/api
```

> ⚠️ After creating or editing `.env`, always restart Vite — it does not hot-reload env changes.

Start the frontend dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 4. Set up Supabase

In your Supabase project, create the following tables:

#### `child_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | auto-generated |
| `user_id` | uuid | references auth.users |
| `name` | text | stored uppercase |
| `avatar` | text | emoji or image key |
| `emoji_pin` | text | JSON stringified array |
| `auth_email` | text | auto-generated internal email |
| `auth_password` | text | stored for re-authentication |
| `onboarding_done` | boolean | default false |
| `sun_coins` | integer | default 0 |
| `streak_days` | integer | default 0 |
| `last_active_date` | date | updated on each login |

#### `adult_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | auto-generated |
| `user_id` | uuid | references auth.users |
| `full_name` | text | |
| `role` | text | `teacher` or `parent` |

Also create the RPC function used during child signup:
```sql
-- Initialises 8 island progress rows for a new student
create or replace function initialise_student_islands(p_student_id uuid)
returns void as $$
begin
  insert into island_progress (student_id, island_id)
  select p_student_id, generate_series(1, 8);
end;
$$ language plpgsql;
```

---

## 🔌 API Reference

All routes are prefixed with `/api`.

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/child/signup` | Create a new child account |
| POST | `/auth/child/login` | Log in with name + emoji PIN |
| POST | `/auth/child/reset-pin` | Reset a child's emoji PIN |
| POST | `/auth/adult/signup` | Create a teacher/parent account |
| POST | `/auth/adult/login` | Log in with email + password |
| POST | `/auth/adult/reset-password` | Reset an adult's password |

### Student

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/student/dashboard` | Get student dashboard data |
| GET | `/student/profile` | Get student profile |
| PUT | `/student/onboarding` | Save onboarding preferences |
| POST | `/student/session/start` | Start a learning session |
| PUT | `/student/session/end` | End session with activity summary |

### Progress

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/progress/activity` | Save a completed activity |
| GET | `/progress/island/:id` | Get progress for a specific island |
| POST | `/progress/coins` | Award Sun Coins to a student |

---

## 🔐 Auth Architecture

Lumina uses a custom auth pattern for child accounts since children can't manage email/password:

- On **signup**, a hidden email (`child_name_xxxx@lumina.app`) and password are auto-generated and stored in `child_profiles`
- On **login**, the child enters their name + emoji PIN → backend looks them up → signs in with stored credentials → returns a Supabase session token
- On **PIN reset**, the emoji PIN and stored password are updated together atomically in both Supabase Auth and `child_profiles`

Adult accounts use standard Supabase email/password auth.

---

## 🧪 Testing the API

With the backend running, test a child login:

```bash
curl -X POST http://localhost:4000/api/auth/child/login \
  -H "Content-Type: application/json" \
  -d '{"name":"ALEX","emojiPin":["🌟","🌈","🦋","🌺"]}'
```

Test adult login:

```bash
curl -X POST http://localhost:4000/api/auth/adult/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"yourpassword"}'
```

---

## 🐛 Common Issues

**`ts-node-dev is not recognized`**
```bash
cd backend && npm install
# or install globally:
npm install -g ts-node-dev
```

**`Failed to fetch` on login page**
- Make sure the backend is running on port 4000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:4000/api`
- Restart Vite after any `.env` changes
- Ensure CORS is enabled in `backend/src/index.ts` for `http://localhost:5173`

**`net::ERR_CONNECTION_REFUSED`**
- Backend is not running — start it with `npm run dev` in the `backend/` folder

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 👥 Team

Built with ❤️ for children who learn differently.

- **Supriya Mulik** — Project Lead
- **Pralhad** — Full Stack Developer
- **Tanavi** — Full Stack Developer
- **Prithviraj** — Full Stack Developer
---


<div align="center">
  <strong>🌟 Every child learns differently. Lumina ensures every child wins. 🌟</strong>
</div>
