# Setup Guide — Family Meal Planner

Follow these steps in order. The whole thing should take about 15 minutes.

---

## Step 1 — Install dependencies

Open your terminal, navigate to this folder, and run:

```bash
npm install
```

---

## Step 2 — Create your Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click **New project** — pick a name like "family-meal-planner", choose a region near you
3. Wait ~2 minutes for it to provision

---

## Step 3 — Enable Google auth in Supabase

1. In your Supabase project, go to **Authentication → Providers**
2. Find **Google** and enable it
3. You'll need a Google OAuth Client ID and Secret — get these from [https://console.cloud.google.com](https://console.cloud.google.com):
   - Create a new project (or use an existing one)
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add this to **Authorized redirect URIs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret back into Supabase
4. In Supabase, also add your local dev URL to **Authentication → URL Configuration → Redirect URLs**: `http://localhost:3000/auth/callback`

---

## Step 4 — Create the database table

In your Supabase project, go to **SQL Editor** and run this:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  family_members jsonb default '[]',
  dietary_restrictions text[] default '{}',
  dislikes text[] default '{}',
  onboarding_complete boolean default false,
  updated_at timestamptz default now()
);

-- Allow users to read and write only their own profile
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Meal plans table (for AI-generated weekly plans)
create table meal_plans (
  user_id uuid references auth.users on delete cascade,
  week_start date not null,
  plan jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (user_id, week_start)
);

alter table meal_plans enable row level security;

create policy "Users can view own meal plans"
  on meal_plans for select using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on meal_plans for insert with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on meal_plans for update using (auth.uid() = user_id);
```

---

## Step 5 — Add your environment variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
2. In Supabase, go to **Settings → API**
3. Copy your **Project URL** and **anon public key**
4. Get an Anthropic API key from [https://console.anthropic.com](https://console.anthropic.com) (for meal plan generation)
5. Paste into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

---

## Step 6 — Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the landing page. Click **Continue with Google**, complete the onboarding flow, and you'll land on the dashboard placeholder.

---

## What's built so far

| Screen | Status |
|--------|--------|
| Landing page with Google sign-in | ✅ Done |
| Onboarding — household setup | ✅ Done |
| Onboarding — dietary restrictions | ✅ Done |
| Onboarding — dislikes | ✅ Done |
| Auth callback + profile save to Supabase | ✅ Done |
| Dashboard placeholder | ✅ Done |
| Meal plan generation | 🔜 Next |
| Grocery list + WhatsApp export | 🔜 Next |
| Recipe import from URL | 🔜 Next |
| Keep / Discard / Tweak ratings | 🔜 Next |

---

## Stuck? Common issues

**Google sign-in isn't working**
→ Double-check that your redirect URI in Google Cloud Console exactly matches what's in Supabase. No trailing slashes.

**"relation profiles does not exist"**
→ You haven't run the SQL in Step 4 yet.

**"relation meal_plans does not exist"**
→ Run the full SQL in Step 4 (including the meal_plans table).

**"Something went wrong generating your plan"**
→ Ensure `ANTHROPIC_API_KEY` is set in `.env.local` and you've created the `meal_plans` table in Supabase.

**Environment variables not loading**
→ Make sure the file is named exactly `.env.local` (with the dot), and restart `npm run dev` after editing it.
