# Supabase Migration - Deployment Checklist

Use this checklist to ensure all migration steps are completed correctly.

## Backend Setup (Supabase)

### Database
- [ ] Created Supabase project at https://ujtlptjowaillhhqnwrb.supabase.co
- [ ] Ran `001_create_ideas_table.sql` migration in SQL Editor
- [ ] Verified `ideas` table exists with correct schema
- [ ] Verified Row Level Security (RLS) policies are enabled
- [ ] Tested database connection

### Secrets & Environment
- [ ] Set `GEMINI_API_KEY` secret using `supabase secrets set GEMINI_API_KEY`
- [ ] Verified secret is set with `supabase secrets list`
- [ ] Obtained Supabase URL: `https://ujtlptjowaillhhqnwrb.supabase.co`
- [ ] Obtained Supabase Anon Key: `eyJhbGci...`
- [ ] Obtained Service Role Key (keep private!)

### Edge Functions
- [ ] Deployed `generate-daily-idea` function
- [ ] Deployed `get-idea` function
- [ ] Deployed `roast-idea` function
- [ ] Deployed `chat` function
- [ ] Tested each function manually (see SETUP.md)
- [ ] Verified functions appear in Supabase Dashboard

### Cron Job
- [ ] Enabled `pg_cron` extension in Database → Extensions
- [ ] Enabled `http` extension (if using SQL method)
- [ ] Created cron job for daily idea generation
- [ ] Verified cron job is scheduled: `SELECT * FROM cron.job;`
- [ ] (Optional) Manually triggered to test

## Frontend Setup

### Configuration
- [ ] Created `.env` file with Supabase credentials
- [ ] Verified `VITE_SUPABASE_URL` is set
- [ ] Verified `VITE_SUPABASE_ANON_KEY` is set
- [ ] `.env` is in `.gitignore` (security check)

### Dependencies
- [ ] Ran `npm install`
- [ ] Verified `@supabase/supabase-js` is installed
- [ ] No build errors

### Code Updates
- [ ] Created `lib/supabaseClient.ts`
- [ ] Created `services/supabaseService.ts`
- [ ] Updated `components/DailyBadIdea.tsx` to use supabaseService
- [ ] Updated `components/IdeaRoaster.tsx` to use supabaseService
- [ ] Updated `components/ChatBot.tsx` to use supabaseService
- [ ] Removed `@google/genai` import from ChatBot

### Local Testing
- [ ] Started dev server: `npm run dev`
- [ ] Tested Daily Bad Idea - loads correctly
- [ ] Tested Daily Bad Idea - shows from database (cached)
- [ ] Tested The Incinerator - roasts ideas correctly
- [ ] Tested The Liquidator - chat works with streaming
- [ ] Checked browser console - no errors
- [ ] Verified localStorage still caches ideas on frontend
- [ ] Tested historical dates (calendar navigation if implemented)

## Production Deployment

### Build
- [ ] Built production bundle: `npm run build`
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] Verified `dist` folder created

### Hosting Platform
Select one:

#### Vercel
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Deployed: `vercel`
- [ ] Set environment variables in Vercel dashboard
- [ ] Verified deployment URL works

#### Netlify
- [ ] Installed Netlify CLI: `npm install -g netlify-cli`
- [ ] Deployed: `netlify deploy --prod`
- [ ] Set environment variables in Netlify dashboard
- [ ] Verified deployment URL works

#### Other (Cloudflare Pages, GitHub Pages, etc.)
- [ ] Uploaded `dist` folder to hosting service
- [ ] Configured environment variables (if supported)
- [ ] Verified deployment URL works

### Production Testing
- [ ] Tested all features on production URL
- [ ] Verified API calls go to Supabase (check Network tab)
- [ ] Tested on mobile device
- [ ] Tested on different browsers
- [ ] Checked performance and load times
- [ ] Verified CORS is working correctly

## Post-Deployment

### Monitoring
- [ ] Checked Supabase Dashboard → Logs → Edge Functions
- [ ] Verified daily idea generated successfully
- [ ] Monitored database for new entries
- [ ] Set up usage alerts in Supabase (optional)

### Cleanup
- [ ] Removed old Google AI API key from frontend (if it was there)
- [ ] Verified no API keys in frontend code
- [ ] Removed or deprecated old `services/geminiService.ts` (optional)
- [ ] Updated documentation

### Documentation
- [ ] Updated README.md with new setup instructions
- [ ] Created CLAUDE.md with project details
- [ ] Created SETUP.md with migration guide
- [ ] Documented any custom configuration

## Security Checklist

- [ ] No API keys in frontend code
- [ ] No API keys committed to Git
- [ ] `.env` is in `.gitignore`
- [ ] Service role key kept private (only in Supabase, never in frontend)
- [ ] Anon key used in frontend (safe to expose)
- [ ] RLS policies enabled on database tables
- [ ] CORS configured correctly
- [ ] HTTPS enforced on production

## Rollback Plan (If Issues Occur)

If you need to rollback:

1. Frontend: Revert imports back to `geminiService.ts`
2. Backend: Keep Supabase running in parallel
3. Database: Export data before making changes
4. Edge Functions: Can be redeployed or disabled individually

## Success Criteria

✅ Daily ideas load from Supabase database
✅ New ideas generated automatically at midnight UTC
✅ All three features working (Daily Idea, Incinerator, Chatbot)
✅ No exposed API keys in frontend
✅ Fast load times (database caching)
✅ Original UI and functionality preserved
✅ Production deployment successful

## Notes

- **First Idea**: The first daily idea should be generated either manually or wait for the cron job
- **Historical Ideas**: Will be generated on-demand when users navigate to past dates
- **Database Growth**: Ideas table will grow by 1 row per day (~365 rows/year)
- **Costs**: Monitor Supabase usage - free tier is generous but watch edge function invocations

---

**Migration Date**: _______________
**Completed By**: _______________
**Production URL**: _______________
