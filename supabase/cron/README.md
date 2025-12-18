# Supabase Cron Job Setup

## Option 1: Using Supabase Dashboard (Recommended)

The easiest way to set up the cron job is through the Supabase Dashboard:

1. Go to your Supabase project: https://ujtlptjowaillhhqnwrb.supabase.co
2. Navigate to **Database → Cron Jobs**
3. Click **Create a new cron job**
4. Configure:
   - **Name**: `generate-daily-idea`
   - **Schedule**: `0 0 * * *` (midnight UTC)
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
5. Click **Create**

## Option 2: Using SQL (Advanced)

If you prefer to set up via SQL:

1. Enable the `pg_cron` extension in **Database → Extensions**
2. Enable the `http` extension in **Database → Extensions**
3. Run the SQL in `daily_idea_generator.sql` in the SQL Editor

## Verifying the Cron Job

To check if your cron job is scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'generate-daily-idea';
```

To see the execution history:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-idea')
ORDER BY start_time DESC
LIMIT 10;
```

## Manual Testing

To manually trigger idea generation (for testing):

```bash
curl -X POST https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/generate-daily-idea \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or run this SQL:

```sql
SELECT
  net.http_post(
    url:='https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/generate-daily-idea',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body:='{}'::jsonb
  ) AS request_id;
```

## Troubleshooting

If the cron job isn't running:

1. Verify `pg_cron` extension is enabled
2. Check that the edge function is deployed
3. Verify the Gemini API key is set as a secret
4. Check the cron job logs in `cron.job_run_details`
5. Ensure the service role key has permission to call edge functions
