# IdeaScower - Project Documentation

## Overview
IdeaScower is a web application that generates and analyzes startup ideas using Google's Gemini AI. The app features three main components:

1. **Daily Bad Idea** - A deterministically generated "bad startup idea" that updates daily at midnight UTC
2. **The Incinerator** - An AI-powered roasting tool that analyzes and critiques user-submitted ideas (3 roasts per 24h for authenticated users)
3. **Devil's Advocate** - A constructive AI business strategist chatbot that helps users refine their ideas (5 messages per 24h for authenticated users)

## Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: Heroicons
- **Markdown**: react-markdown

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase Edge Functions (Deno)
- **AI Model**: Google Gemini 3 Pro Preview (`gemini-3-pro-preview`)
- **Cron**: Supabase scheduled functions

## AI Configuration

### Model Settings
- **Model**: `gemini-3-pro-preview`
- **Thinking Budget**: 32768 tokens
- **Temperature**: 0 (for daily ideas - deterministic)

### System Prompts

#### Daily Bad Idea Generator
```
Generate a startup idea that sounds revolutionary and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business. Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.
```

#### Idea Roaster (The Incinerator)
```
You are a ruthless venture capitalist who specializes in spotting failure.
Your goal is to deconstruct why this startup idea will fail. Look for market size issues, unit economics, technical impossibility, or competition.
Be harsh, witty, and deeply analytical.
```

#### Devil's Advocate
```
You are "Devil's Advocate", an experienced business strategist and brainstorming partner with decades of experience as a successful founder and angel investor across every industry niche.

Your role is to help users refine their business ideas by critically examining them from every angle. You have a strong bias toward identifying potential weaknesses, blind spots, and failure modes in any business model.

Your personality:
- Kind and supportive, but no-nonsense and direct
- You genuinely want the user to succeed, which is why you push them hard
- You ask probing questions rather than just giving answers
- You help users think through logistics, unit economics, market dynamics, and execution risks
- You suggest clever, thoughtful ways to address weaknesses you identify
```

## Database Schema

### `ideas` table
Stores all generated daily ideas with their metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| date | date | The UTC date this idea represents (unique) |
| seed | integer | Deterministic seed (YYYYMMDD format) |
| title | text | Startup name |
| pitch | text | The elevator pitch |
| fatal_flaw | text | Analysis of why it will fail |
| verdict | text | One-sentence summary |
| created_at | timestamptz | When this record was created |

### `devils_advocate_usage` table
Tracks rate limiting for Devil's Advocate chat (5 messages per 24 hours per user).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users(id) |
| created_at | timestamptz | When the message was sent |

## API Endpoints (Edge Functions)

### 1. `generate-daily-idea`
Generates and stores a new daily idea. Called by cron at midnight UTC.

**Method**: POST
**Auth**: Service role key (internal only)
**Body**:
```json
{
  "date": "2025-12-18" // optional, defaults to today
}
```

### 2. `get-idea`
Retrieves an idea for a specific date. If not in DB, generates on-demand.

**Method**: GET
**Auth**: Public (anon key)
**Query**: `?date=2025-12-18`

### 3. `roast-idea`
Analyzes and roasts a user-submitted idea.

**Method**: POST
**Auth**: Public (anon key)
**Body**:
```json
{
  "idea": "Uber for walking dogs but the dogs walk you"
}
```

### 4. `devils-advocate-chat`
Streaming chat endpoint for Devil's Advocate with rate limiting.

**Method**: POST
**Auth**: Required (user must be authenticated)
**Rate Limit**: 5 messages per 24 hours
**Body**:
```json
{
  "history": [...],
  "message": "I want to build an app that helps people..."
}
```

### 5. `check-devils-advocate-usage`
Checks the user's current Devil's Advocate usage/rate limit status.

**Method**: GET
**Auth**: Required (user must be authenticated)
**Response**:
```json
{
  "remaining": 4,
  "resetAt": "2025-12-19T00:00:00Z",
  "limit": 5
}
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://ncoasjfowlpnkfvpiibu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Supabase Edge Functions (.env)
```
GEMINI_API_KEY=your_google_ai_api_key_here
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Run development server:
   ```bash
   npm run dev
   ```

4. Deploy edge functions:
   ```bash
   supabase functions deploy generate-daily-idea
   supabase functions deploy get-idea
   supabase functions deploy roast-idea
   supabase functions deploy devils-advocate-chat
   supabase functions deploy check-devils-advocate-usage
   ```

## Migration from Google AI Studio

This project was originally built using direct Google AI Studio API calls from the frontend. The migration to Supabase provides:

1. **Security**: API keys are now stored server-side in edge functions
2. **Performance**: Daily ideas are pre-generated and cached in the database
3. **History**: All ideas are permanently stored and queryable
4. **Scalability**: Edge functions handle rate limiting and resource management

## Cron Schedule

- **Daily Idea Generation**: Runs at `0 0 * * *` (midnight UTC)
- Automatically generates and stores the idea for the new day

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting service.

### Backend
Supabase handles all backend infrastructure including:
- PostgreSQL database
- Edge Functions (Deno runtime)
- Scheduled functions (cron)
- Authentication (if needed in future)

## Future Enhancements

- User accounts and saved ideas
- Upvoting/downvoting ideas
- Social sharing features
- Analytics dashboard
- API rate limiting per user
