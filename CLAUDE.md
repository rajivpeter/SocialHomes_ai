# SocialHomes.Ai — Claude Code Project Instructions

## Project Overview
AI-native social housing management platform for UK housing associations.
React 19 + Express + Firestore on Google Cloud Run (europe-west2).

## Key Files
- `Doc1-SocialHomesAi-Base-Specification.txt` — Base product spec
- `Doc2-SocialHomesAi-AI-Native-Features.txt` — AI features spec
- `Doc3-Public-API-Integration-Requirements.txt` — Public API integration requirements
- `SESSION-HISTORY.md` — Persistent conversation history (update at end of each session)
- `DEV-FIX-LIST.md` — Bug/warning tracker from Selenium tests
- `DEVOPS.md` — DevOps and deployment guide

## Commands
- **Build frontend:** `cd app && npm run build`
- **Build server:** `cd server && npm run build`
- **TypeScript check:** `cd app && node node_modules/typescript/bin/tsc --noEmit`
- **Deploy:** `git push origin main` (triggers Cloud Build automatically)
- **Entire.io status:** `/home/rajiv/.local/bin/entire status`

## Conventions
- Use Tailwind CSS for styling (dark theme with brand-teal accent)
- Use `safeText()` helper for rendering potentially undefined values
- Use `?? []` for nullable arrays to prevent React Error #310
- All API routes in `server/src/routes/`
- All frontend pages in `app/src/pages/`
- Shared components in `app/src/components/shared/`
- Layout components in `app/src/components/layout/`
- Data/hooks in `app/src/data/` and `app/src/hooks/`

## Telegram Notifications
Bot: @SocialHomesBot — configured via .mcp.json (not committed to repo).
Use `mcp__telegram__notify_user` for async one-way messages (no reply needed).
Use `mcp__telegram__send_message` when you need a response from the user.
Chat ID: `socialhomes:8020560167`

## Session Continuity
At the END of every session, update SESSION-HISTORY.md with:
- What was done
- Files changed
- Commits made
- Decisions taken
- Any pending work

## Important Notes
- Never commit .env files or API keys
- .mcp.json contains bot token — already in .gitignore
- npm install requires --legacy-peer-deps (firebaseui conflict)
- Node.js 20.17.0 — Vite warns about needing 20.19+ but builds fine
- Entire.io hooks need PATH export: `export PATH="$HOME/.local/bin:$PATH"`
