# IdeaScower - Supabase Migration Setup Guide

This guide will help you complete the migration from Google AI Studio to Supabase backend.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Gemini API key
- Supabase CLI (optional but recommended)

## Step 1: Install Supabase CLI (Optional)

```bash
npm install -g supabase
```

Or follow instructions at: https://supabase.com/docs/guides/cli

## Step 2: Link Your Supabase Project

```bash
supabase login
supabase link --project-ref ujtlptjowaillhhqnwrb
```

## Step 3: Set Up the Database

### Option A: Using Supabase Dashboard (Easiest)

1. Go to https://ujtlptjowaillhhqnwrb.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_ideas_table.sql`
4. Click **Run**

### Option B: Using Supabase CLI

```bash
supabase db push
```

## Step 4: Configure Secrets

You need to set your Gemini API key as a secret for the edge functions:

```bash
echo "YOUR_GEMINI_API_KEY_HERE" | supabase secrets set GEMINI_API_KEY
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.

## Step 5: Deploy Edge Functions

Deploy all edge functions at once:

```bash
supabase functions deploy generate-daily-idea
supabase functions deploy get-idea
supabase functions deploy roast-idea
supabase functions deploy chat
```

Or deploy them all:

```bash
cd supabase/functions
for func in */; do supabase functions deploy "${func%/}"; done
```

## Step 6: Set Up the Cron Job

Follow the instructions in `supabase/cron/README.md` to set up the daily idea generation.

**Quick method via Dashboard:**

1. Go to **Database → Cron Jobs** in your Supabase dashboard
2. Create a new cron job:
   - **Name**: `generate-daily-idea`
   - **Schedule**: `0 0 * * *`
   - **SQL**:
   ```sql
   SELECT
     net.http_post(
       url:='https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/generate-daily-idea',
       headers:=jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
       ),
       body:='{}'::jsonb
     ) AS request_id;
   ```

## Step 7: Install Frontend Dependencies

```bash
npm install
```

The `.env` file has already been created with your Supabase credentials.

## Step 8: Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:

1. **Daily Bad Idea** - Should load from your Supabase backend
2. **The Incinerator** - Submit an idea and verify it gets roasted
3. **The Liquidator** - Open the chat and test the conversation

## Step 9: Verify Edge Functions

Test each edge function manually:

### Test get-idea:
```bash
curl "https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/get-idea?date=2025-12-18" \
  -H "apikey: YOUR_ANON_KEY"
```

### Test roast-idea:
```bash
curl -X POST "https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/roast-idea" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"idea": "Uber for cats"}'
```

### Test generate-daily-idea (manual trigger):
```bash
curl -X POST "https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/generate-daily-idea" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Step 10: Deploy Frontend

### Option A: Vercel

```bash
npm install -g vercel
vercel
```

Make sure to set environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Set environment variables in Netlify dashboard.

### Option C: Other Static Hosts

Build the project:

```bash
npm run build
```

Deploy the `dist` folder to any static host (GitHub Pages, Cloudflare Pages, etc.)

## Troubleshooting

### Edge functions not working

1. Verify they're deployed: `supabase functions list`
2. Check logs: `supabase functions logs <function-name>`
3. Verify GEMINI_API_KEY secret is set: `supabase secrets list`

### Database connection issues

1. Check if the table exists: Run `SELECT * FROM ideas LIMIT 1;` in SQL Editor
2. Verify Row Level Security policies are set correctly

### Cron job not running

1. Check if `pg_cron` extension is enabled in **Database → Extensions**
2. Verify the job is scheduled: `SELECT * FROM cron.job;`
3. Check execution history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Frontend not connecting to backend

1. Verify `.env` file exists and has correct values
2. Check browser console for errors
3. Verify CORS is working (check Network tab in DevTools)

## Migration Complete!

Your app is now running on Supabase with:

✅ Secure API key storage in edge functions
✅ Database-backed daily ideas with history
✅ Automatic daily idea generation at midnight UTC
✅ Fast loading from cached database entries
✅ All original features and UI preserved

## Next Steps

- Monitor your Supabase usage dashboard
- Set up backups for your database
- Consider adding user authentication
- Implement analytics to track idea popularity
- Add more features like voting or sharing
