-- Enable pg_cron extension (if not already enabled)
-- This needs to be run by a database administrator
-- Go to Database -> Extensions in Supabase Dashboard and enable pg_cron

-- Create a function that calls the edge function
CREATE OR REPLACE FUNCTION generate_daily_idea_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response json;
BEGIN
  -- Call the generate-daily-idea edge function via HTTP
  -- Note: This requires the http extension to be enabled
  SELECT content::json INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/generate-daily-idea',
    ARRAY[
      http_header('apikey', current_setting('app.settings.service_role_key')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);

  RAISE NOTICE 'Daily idea generated: %', response;
END;
$$;

-- Schedule the function to run at midnight UTC every day
-- Cron format: minute hour day month weekday
-- 0 0 * * * means "at minute 0 of hour 0 (midnight) every day"
SELECT cron.schedule(
  'generate-daily-idea',           -- job name
  '0 0 * * *',                      -- cron schedule (midnight UTC)
  'SELECT generate_daily_idea_cron();'
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('generate-daily-idea');
