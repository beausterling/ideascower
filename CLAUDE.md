# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeasCower is a satirical web application that generates intentionally bad startup ideas and roasts user-submitted ideas. It uses Google's Gemini API (specifically the "gemini-3-pro-preview" model with extended thinking capabilities) to provide witty, analytical critiques of startup concepts.

## Development Commands

```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

The app requires a Gemini API key. Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

The Vite config (vite.config.ts:14-15) exposes this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Architecture

### Application Structure

- **App.tsx**: Root component with two-tab navigation (Daily Doom / The Incinerator)
- **components/DailyBadIdea.tsx**: Displays AI-generated bad startup ideas
- **components/IdeaRoaster.tsx**: User input form for idea roasting
- **components/ChatBot.tsx**: Floating chat interface called "The Liquidator"
- **services/geminiService.ts**: All Gemini API interactions
- **types.ts**: TypeScript interfaces for BadIdea, RoastResult, ChatMessage, AppSection

### Key Technical Details

**Gemini Integration**:
- Model: `gemini-3-pro-preview` (services/geminiService.ts:8)
- Thinking budget: 32,768 tokens for extended reasoning (services/geminiService.ts:9)
- Three main functions:
  - `getDailyBadIdea()`: Uses structured output (JSON schema) to generate formatted bad ideas
  - `roastUserIdea()`: Free-form text critique of user ideas
  - `sendChatMessage()`: Streaming chat responses for the ChatBot

**Styling**:
- Uses Tailwind CSS with custom color palette defined via CSS variables
- Custom colors: `tower-black`, `tower-dark`, `tower-gray`, `tower-accent` (orange), `tower-neon` (green)
- No tailwind.config.js file; relies on default Tailwind + inline styles

**Assets**:
- Logo: lava-ball-final.png (spinning lava/rock sphere) loaded via GitHub raw URL permalink
- Fallback SVG graphic if image fails to load (App.tsx:38-55)

### Important Patterns

1. **Error Handling**: All Gemini API calls have try/catch blocks with fallback responses
2. **Streaming**: ChatBot component uses `sendMessageStream()` and accumulates chunks in real-time
3. **State Management**: Pure React useState, no external state libraries
4. **Path Alias**: `@/` is aliased to project root (vite.config.ts:19, tsconfig.json:22-24)

## Brand Voice

The application's personality is sardonic and analytical. When generating content or prompts:
- Use terms like "Daily Doom", "The Incinerator", "The Liquidator"
- Emphasize failure analysis and "trap ideas" that sound good but are fundamentally flawed
- Maintain a dark/industrial aesthetic (tower metaphor, fire/destruction imagery)
