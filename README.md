# CardVault 📇

Exhibition visiting card & lead management system.  
PWA — works as both a mobile app (scan cards) and a web dashboard (manage, export, analyse).

---

## Stack

| Layer | Tech | Cost |
|---|---|---|
| Frontend | React + Vite | Free |
| Hosting | Vercel | Free |
| Database | Supabase (Postgres) | Free tier |
| Auth | Supabase Auth | Free |
| Storage | Supabase Storage | 1GB free |
| OCR | Tesseract.js (in-browser) | Free |
| Export | SheetJS / xlsx | Free |

---

## Setup — Step by Step

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Give it a name (e.g. `cardvault`), set a database password, choose a region (e.g. `ap-south-1` for India)
3. Wait for the project to provision (~2 min)

### 2. Run Database SQL

1. In your Supabase dashboard → **SQL Editor**
2. Paste the entire contents of `supabase_setup.sql`
3. Click **Run**

### 3. Create Storage Bucket

1. Supabase dashboard → **Storage** → **New Bucket**
2. Name: `card-images`
3. Public: **OFF** (private bucket)
4. Click Create

Then add policies: Storage → Policies → card-images bucket → Add Policy:
- **SELECT**: For authenticated users: `bucket_id = 'card-images'`
- **INSERT**: For authenticated users: `bucket_id = 'card-images'`

### 4. Get API Keys

Supabase dashboard → **Settings** → **API**

Copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

### 5. Local Setup

```bash
# Clone / download this project
cd cardvault

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and paste your Supabase URL and anon key

# Start dev server
npm run dev
```

Open `http://localhost:5173` — create your first account.

### 6. Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Or push to GitHub → connect repo on [vercel.com](https://vercel.com) → add environment variables in Vercel project settings.

### 7. Install as Mobile App (PWA)

1. Open the deployed URL in **Chrome** on your phone
2. Tap the **⋮ menu** → **Add to Home Screen**
3. It now works like a native app — camera access, offline support, no App Store needed

---

## Accounts & Multi-tenancy

- Each company signs up independently at `/signup`
- They create their own org name and become Admin
- Admin can invite team members (team members sign up with the invited email)
- **Zero data leakage** — database-level RLS policies ensure each org only sees their own data

---

## File Structure

```
cardvault/
├── src/
│   ├── components/
│   │   ├── LeadCard.jsx      ← single contact display
│   │   ├── LeadForm.jsx      ← 14-field form (add + edit)
│   │   ├── Scanner.jsx       ← camera + Tesseract OCR
│   │   ├── ExhibitionPicker.jsx  ← shown after login on mobile
│   │   └── Toast.jsx         ← notification system
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx        ← creates org + admin
│   │   ├── MobileHome.jsx    ← main mobile scanning view
│   │   ├── DashboardLayout.jsx  ← sidebar wrapper
│   │   ├── Dashboard.jsx     ← leads table + filters
│   │   ├── Exhibitions.jsx   ← manage exhibitions
│   │   ├── Team.jsx          ← manage members
│   │   ├── Analytics.jsx     ← charts + stats
│   │   └── Export.jsx        ← Excel + CSV export
│   ├── hooks/
│   │   ├── useAuth.js        ← auth context + session
│   │   └── useLeads.js       ← leads, exhibitions, team CRUD + realtime
│   ├── lib/
│   │   ├── supabase.js       ← Supabase client + auth + storage
│   │   ├── ocr.js            ← Tesseract.js wrapper + field parser
│   │   └── export.js         ← Excel/CSV export
│   ├── App.jsx               ← routing (mobile vs desktop detection)
│   ├── main.jsx
│   └── styles.css            ← all styles + design tokens
├── supabase_setup.sql
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## Extending the App

**Add a new field to leads:**
1. Add the column in `supabase_setup.sql` and run `ALTER TABLE leads ADD COLUMN ...`
2. Add the field in `LeadForm.jsx`
3. Add it to `FIELD_LABELS` in `export.js`
4. Display it in `LeadCard.jsx` if needed

**Add a new page:**
1. Create `src/pages/YourPage.jsx`
2. Add a route in `App.jsx`
3. Add a nav item in `DashboardLayout.jsx`

**Change colours:**
All design tokens are in `src/styles.css` under `:root { ... }`. Edit those variables and the entire UI updates.

---

## OCR Notes

- OCR runs 100% in the browser using Tesseract.js — no API calls, no cost, no data leaves the device
- Works best on clean, high-contrast printed cards
- Accuracy varies; all fields are editable after scanning
- Supports English + Hindi out of the box. Add more languages in `ocr.js` → `Tesseract.recognize(file, 'eng+hin+deu+...')`

---

## Free Tier Limits (Supabase)

| Resource | Free limit | Your usage |
|---|---|---|
| Database | 500MB | ~100K+ contacts |
| Storage | 1GB | ~5,000 card images |
| Auth | Unlimited users | ✓ |
| Realtime | 200 concurrent | ✓ |
| API requests | Unlimited | ✓ |

You'll never hit these limits for exhibition use.
