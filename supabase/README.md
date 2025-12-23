# Supabase Setup

## Database Migration

To apply the database schema, run this SQL in your Supabase SQL Editor:

1. Go to your Supabase project: https://ujtlptjowaillhhqnwrb.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_create_ideas_table.sql`
4. Click "Run"

Alternatively, if you have Supabase CLI installed:

```bash
supabase db push
```

## Edge Functions

### Prerequisites
- Install Supabase CLI: https://supabase.com/docs/guides/cli
- Login: `supabase login`
- Link project: `supabase link --project-ref ujtlptjowaillhhqnwrb`

### Set Secrets

You need to set your Gemini API key as a secret:

```bash
echo "YOUR_GEMINI_API_KEY" | supabase secrets set GEMINI_API_KEY
```

### Deploy Functions

Deploy all functions:

```bash
supabase functions deploy generate-daily-idea
supabase functions deploy get-idea
supabase functions deploy roast-idea
supabase functions deploy chat
```

Or deploy all at once:

```bash
supabase functions deploy
```

## Cron Jobs

To set up the daily idea generation cron job:

1. Go to Database → Extensions in Supabase Dashboard
2. Enable `pg_cron` extension
3. Run the SQL in `cron/daily_idea_generator.sql`

Alternatively, you can use the Supabase Dashboard:
1. Go to Database → Cron Jobs
2. Create a new cron job with schedule `0 0 * * *` (midnight UTC)
3. Set it to call the `generate-daily-idea` edge function
