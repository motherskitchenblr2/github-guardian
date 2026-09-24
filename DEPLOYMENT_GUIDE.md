# 🚀 Cloud Deployment Guide — Vercel & Supabase (Free Tier)

This guide walks you through deploying the **GitHub Guardian Mobile-First Suite** to Vercel with optional Supabase persistence.

---

## ⚡ Option 1: Vercel Deployment (Recommended — 60 Seconds)

Vercel provides free, high-performance edge hosting with zero server maintenance.

### Step 1: Import the GitHub Repository
1. Navigate to **[vercel.com/new](https://vercel.com/new)**.
2. Sign in with your GitHub account (`motherskitchenblr2`).
3. Select and import the repository: **`github-guardian`**.

### Step 2: Configure Environment Variables
In the **Environment Variables** section before clicking deploy, add:

| Variable Name | Value | Required? | Purpose |
| :--- | :--- | :--- | :--- |
| `GITHUB_TOKEN` | *Your GitHub Personal Access Token* | **Yes** | Serverless API authentication for PR reviews & fork syncs |
| `NEXT_PUBLIC_SUPABASE_URL` | *Your Supabase Project URL* | Optional | Enables database logging & live subscriptions |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Your Supabase Anon Key* | Optional | Enables database access |

### Step 3: Deploy
1. Click **Deploy**.
2. Within 60 seconds, your mobile dashboard will be live at:  
   `https://github-guardian.vercel.app` (or your custom project URL).
3. Bookmark this URL on your mobile phone or tap **"Add to Home Screen"** to use it as a native web app!

---

## 🗄️ Setting up Supabase Database (Free Tier)

Supabase gives you a free PostgreSQL database to store historical audit logs and real-time updates.

1. Go to **[supabase.com](https://supabase.com)** and create a free account.
2. Click **New Project** and choose a name (e.g., `github-guardian-db`).
3. Navigate to **SQL Editor** -> **New Query**.
4. Open the SQL file:  
   [`supabase/schema.sql`](file:///data/data/com.termux/files/home/github-guardian/supabase/schema.sql)
5. Paste the entire SQL schema and click **Run**.
6. Navigate to **Project Settings** -> **API** to copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Add these two variables to your Vercel project settings.

---

## 📱 Mobile-First Features & UX

- **Zero Horizontal Crushing:** Standard wide tables are replaced with touch cards on screens under 768px.
- **Thumb Reachability:** Includes a floating bottom navigation bar for quick one-handed switching between PRs, Forks, Secrets, and Security.
- **1-Tap Actions:**
  - `⚡ Squash Merge`: Completes the PR immediately.
  - `🔄 Rebase Conflict`: Dispatches `@dependabot rebase`.
  - `🍴 Sync`: Fast-forwards forked repositories with upstream origins.
- **Safe Area Insets:** Automatically respects iPhone Dynamic Island and Android navigation bars.
