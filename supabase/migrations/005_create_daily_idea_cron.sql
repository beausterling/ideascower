-- Enable pg_net extension for HTTP calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the cron job to generate daily ideas at midnight UTC
-- This calls the generate-daily-idea edge function
SELECT cron.schedule(
  'generate-daily-idea',           -- job name
  '0 0 * * *',                     -- cron schedule: midnight UTC every day
  $$
  SELECT net.http_post(
    url := 'https://ncoasjfowlpnkfvpiibu.supabase.co/functions/v1/generate-daily-idea',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jb2FzamZvd2xwbmtmdnBpaWJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE5MTYxMCwiZXhwIjoyMDgxNzY3NjEwfQ.Ic70yknRcZUJpyRTZ0XFt8RZ6u19xTLp_JXPVtOH01o'
    ),
    body := '{}'::jsonb
  );
  $$
);
