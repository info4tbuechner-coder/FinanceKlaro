# Finance App

A React/TypeScript personal finance dashboard built with Vite.

## Features
- Dashboard with financial overview and stats
- Transaction list management
- Upcoming bills tracker
- Reports and analytics (recharts)
- Google Gemini AI integration
- Internet Computer (ICP/DFINITY) integration

## Tech Stack
- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Custom UI components (components/ui.tsx)
- **Charts**: Recharts
- **AI**: Google Gemini API (@google/genai)
- **Blockchain**: DFINITY/ICP agent, auth-client, candid, principal

## Project Structure
- `App.tsx` - Root application component
- `index.tsx` - Entry point
- `components/` - UI components (Dashboard, Header, TransactionList, etc.)
- `context/AppContext.tsx` - Global app state
- `hooks/` - Custom React hooks
- `services/ic.ts` - Internet Computer service
- `utils/` - Utility functions
- `types.ts` - TypeScript type definitions

## Environment Variables
- `GEMINI_API_KEY` - Required for AI features

## Development
- Dev server runs on port 5000 (0.0.0.0)
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Deployment
- Configured as a **static** deployment
- Build command: `npm run build`
- Public directory: `dist`
