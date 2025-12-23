# IdeaScower

A web application that generates and analyzes startup ideas using Google's Gemini AI, featuring a daily "bad idea" generator, an AI-powered idea roaster, and a cynical business consultant chatbot.

## Features

### 📅 Daily Bad Idea
Every day at midnight UTC, a new "trap" startup idea is generated and stored. These ideas sound revolutionary on the surface but have catastrophic flaws that make them terrible businesses. View the history of ideas over time.

### 🔥 The Incinerator
Submit your startup idea and watch it get brutally analyzed by a ruthless venture capitalist AI. Get harsh, witty, and deeply analytical feedback on why your idea will fail.

### 💬 The Liquidator
Chat with a cynical AI business consultant who assumes every idea is doomed to fail. Get dry, sarcastic, and technically precise feedback on your business plans.

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Heroicons** - Icons
- **react-markdown** - Markdown rendering

### Backend
- **Supabase** - PostgreSQL database & edge functions
- **Google Gemini 3 Pro** - AI model (via edge functions)
- **Deno** - Runtime for edge functions

## Architecture

This app uses a serverless architecture with Supabase:

1. **Daily Idea Generation**: A cron job runs at midnight UTC to generate and store ideas
2. **Database Caching**: All ideas are stored in PostgreSQL for fast retrieval
3. **Edge Functions**: API logic runs in Supabase edge functions (Deno)
4. **Secure API Keys**: Gemini API key is stored server-side, never exposed to clients

## Setup

See [SETUP.md](./SETUP.md) for detailed migration and deployment instructions.

### Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (`.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Supabase Setup

This project requires:

1. **Database Table**: `ideas` table for storing daily ideas
2. **Edge Functions**: 4 functions (`generate-daily-idea`, `get-idea`, `roast-idea`, `chat`)
3. **Cron Job**: Daily task at midnight UTC
4. **Secrets**: `GEMINI_API_KEY` environment variable

See [supabase/README.md](./supabase/README.md) for backend setup instructions.

## Project Structure

```
ideascower/
├── components/           # React components
│   ├── DailyBadIdea.tsx # Daily idea display
│   ├── IdeaRoaster.tsx  # The Incinerator
│   └── ChatBot.tsx      # The Liquidator
├── services/            # API services
│   └── supabaseService.ts
├── lib/                 # Utilities
│   └── supabaseClient.ts
├── supabase/           # Backend code
│   ├── functions/      # Edge functions
│   ├── migrations/     # Database schema
│   └── cron/          # Cron job setup
├── SETUP.md           # Setup guide
├── CLAUDE.md          # Project documentation
└── DEPLOYMENT_CHECKLIST.md
```

## AI Configuration

- **Model**: Gemini 3 Pro Preview (`gemini-3-pro-preview`)
- **Thinking Budget**: 32,768 tokens
- **Deterministic Ideas**: Each date generates the same idea using date-based seeds
- **Temperature**: 0 for daily ideas (deterministic), default for roasting/chat

## Development

### Local Development
```bash
npm run dev
```

### Type Checking
```bash
npx tsc --noEmit
```

### Building
```bash
npm run build
```

## Deployment

### Frontend
Deploy to any static hosting service:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- GitHub Pages

### Backend
Managed by Supabase:
- Edge functions auto-scale
- Database backups included
- Cron jobs run automatically

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for full deployment guide.

## Migration from Google AI Studio

This project was migrated from Google AI Studio to Supabase for:

✅ **Security**: API keys now stored server-side
✅ **Performance**: Ideas cached in database
✅ **History**: Permanent storage of all ideas
✅ **Scalability**: Edge functions handle rate limiting

See [CLAUDE.md](./CLAUDE.md) for full migration details.

## License & Copyright

© 2025 Beau Sterling. All rights reserved.

This repository is publicly viewable for transparency and demonstration purposes.
No license is granted for reuse, modification, or redistribution.

## Links

- [Supabase Project](https://ujtlptjowaillhhqnwrb.supabase.co)
- [Google Gemini](https://ai.google.dev/)
- [Setup Guide](./SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
