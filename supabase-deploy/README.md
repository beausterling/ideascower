# Deploy Edge Functions via Supabase Dashboard

These are self-contained versions of the edge functions ready to deploy via the Supabase Dashboard.

## Deployment Steps

1. Go to: https://supabase.com/dashboard/project/ujtlptjowaillhhqnwrb/functions

2. For each function below, click **"Create a new function"** or **"Deploy a new version"**

3. Copy the entire contents of each file and paste it into the editor

4. Click **"Deploy"**

## Functions to Deploy

### 1. get-idea
- **File**: `get-idea.ts`
- **Purpose**: Retrieves daily ideas from database or generates on-demand
- **Used by**: Daily Bad Idea component

### 2. roast-idea
- **File**: `roast-idea.ts`
- **Purpose**: Roasts user-submitted ideas
- **Used by**: The Incinerator component

### 3. chat
- **File**: `chat.ts`
- **Purpose**: Streaming chat with The Liquidator
- **Used by**: ChatBot component

### 4. generate-daily-idea
- **File**: `generate-daily-idea.ts`
- **Purpose**: Generates and stores daily ideas (called by cron)
- **Used by**: Cron job at midnight UTC

## After Deployment

Test each function:

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

### Test chat:
```bash
curl -X POST "https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/chat" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"history": [], "message": "Will my startup work?"}'
```

### Test generate-daily-idea (use service role key):
```bash
curl -X POST "https://ujtlptjowaillhhqnwrb.supabase.co/functions/v1/generate-daily-idea" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Verification

Once deployed, you should see all 4 functions in your Supabase dashboard at:
https://supabase.com/dashboard/project/ujtlptjowaillhhqnwrb/functions

Then you can test your frontend locally with:
```bash
npm run dev
```
