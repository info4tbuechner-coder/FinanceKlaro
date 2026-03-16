# Finance App – Klaro

Eine React/TypeScript Personal-Finance-App (PWA) gebaut mit Vite.

## Features
- Dashboard mit Finanzübersicht und Stats (Einnahmen, Ausgaben, Gespart, Saldo)
- Transaktionsliste mit Filter, Suche und Tags
- Budgetübersicht pro Kategorie
- Upcoming Bills / Wiederkehrende Transaktionen
- Berichte & Cashflow-Analyse (Recharts)
- Projektverfolgung & Sparziele
- Verbindlichkeiten-Verwaltung (Schulden/Darlehen)
- Google Gemini KI-Belegscan (Kamera)
- Replit Auth Login (Google, GitHub, E-Mail) via OpenID Connect
- Internet Computer (ICP/DFINITY) Login-Integration
- PWA mit Service Worker & Offline-Support
- 5 Themes (Grandeur, Synthwave, Blockchain, Neon, Forest)
- Privacy-Modus (Daten unscharf)
- Kategorienverwaltung: Ausgaben- und Einnahmen-Kategorien, Budget pro Kategorie, Inline-Bearbeitung
- Tag-System: Tags auf Transaktionen (Chip-UI, Autocomplete), vordefinierte Tags, Tag-Manager

## Tech Stack
- **Frontend**: React 19, TypeScript
- **Build**: Vite 6 + @tailwindcss/vite (Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 mit CSS Custom Properties Themes
- **Charts**: Recharts (npm, kein CDN)
- **AI**: Google Gemini API (@google/genai)
- **Auth**: Replit Auth (OpenID Connect) via openid-client, passport, express-session, connect-pg-simple
- **Backend**: Express + tsx (Auth-Server auf Port 5001, Vite-Proxy für /api/*)
- **Database**: PostgreSQL (sessions + users Tabellen für Auth)
- **Blockchain**: DFINITY/ICP agent, auth-client, candid, principal
- **Date**: date-fns v4

## Auth-Architektur
- `server/index.ts` – Express Auth-Server (PORT 5001), graceful shutdown (SIGTERM/SIGINT), health check `/health`
- `server/replit_integrations/auth/replitAuth.ts` – OpenID Connect Setup, `getPublicDomain()` liest X-Forwarded-Host oder REPLIT_DEV_DOMAIN
- `hooks/useAuth.ts` – Frontend-Auth-Hook: sessionStorage-Cache (5 Min TTL), 5s AbortController-Timeout, instant re-auth auf Folge-Besuchen
- `components/LoginPage.tsx` – Split-Screen-Login (hardcoded Colors, kein Theme-Dependency), setzt body-Hintergrund via useEffect
- `components/Header.tsx` – UserAvatar-Dropdown mit Logout
- `App.tsx` – Auth-Gate: Spinner → LoginPage → App
- Vite Proxy: `/api/*` → `http://localhost:5001` mit `changeOrigin + xfwd: true`
- DB: `shared/models/auth.ts` (sessions + users Drizzle-Schema, bereits migriert)

## Projektstruktur
- `App.tsx` – Root-Komponente, Navigation, Mobile-Nav
- `index.tsx` – Einstiegspunkt, CSS-Import, Service Worker
- `index.css` – Tailwind v4 Import + @theme inline (CSS-Variable-Mapping)
- `index.html` – HTML-Shell, Theme-Styles, PWA-Tags (alle Theme-CSS-Vars inline im <style>-Block)
- `sw.js` – Service Worker v12 (Cache-Strategie: /api/* NIE gecacht, Font/Icons cache-first, App-Shell stale-while-revalidate)
- `components/` – Dashboard, Header, TransactionList, RightSidebar, UpcomingBills
- `components/modals/` – ModalManager (Router) + je eine Datei pro Modal (lazy geladen)
- `components/ui.tsx` – UI-Komponenten (Modal, Input, Button...)
- `context/AppContext.tsx` – Globaler State (useReducer + localStorage)
- `hooks/` – useDashboardStats, useReportsData, useFilteredTransactions, useLocalStorage, useAuth
- `services/ic.ts` – Internet Computer Service
- `utils/` – financialUtils, formatCurrency, etc.
- `types.ts` – TypeScript Typen

## Performance / Bundle
- **Lazy-Loading**: Alle Modal-Komponenten via `React.lazy()` – nur bei Bedarf geladen
- **Bundle-Split**: vendor-react 194KB, vendor-charts 316KB (lazy via Recharts), vendor-ai 273KB, vendor-misc 83KB, vendor-dates 33KB, vendor-icons 23KB, index.js 75KB
- **Build**: target es2020, esbuild minify, CSS minify, server-only packages via optimizeDeps.exclude
- **Cashflow**: O(N) Map-Algorithmus (statt O(12×N) Loop)
- **Pagination**: TransactionList zeigt 25 Einträge + "Mehr laden"
- **Splash-Screen**: `components/SplashScreen.tsx` – einmal pro Session, "Ch. von Büchner" Credit
- **Privacy-Modus**: `data-privacy`-Attribut auf sensiblen Werten, CSS-Blur
- **Auth-Cache**: useAuth nutzt sessionStorage (5 Min TTL) → kein Loading-Flash bei Navigation

## Konfiguration
- Dev-Server: `0.0.0.0:5000`, `allowedHosts: true`
- Auth-Server: Port 5001 (AUTH_PORT), Workflow "Auth server"
- Deployment: Static Site + Auth-Server benötigt separaten Prozess
- Tailwind CSS v4 via `@tailwindcss/vite` Plugin

## Umgebungsvariablen
- `GEMINI_API_KEY` – Für KI-Features (Belegscan, Analyse)
- `DATABASE_URL` – PostgreSQL Verbindung (Sessions, User)
- `SESSION_SECRET` – Express-Session-Secret
- `REPL_ID` – Replit Repl-ID (OAuth-Client-ID)
- `REPLIT_DEV_DOMAIN` – Öffentliche Domain für OAuth-Callback

## Befehle
- `npm run dev` – Entwicklungsserver starten (Port 5000)
- `npx tsx server/index.ts` – Auth-Server starten (Port 5001)
- `npm run build` – Produktions-Build erstellen
- `npm run lint` – TypeScript prüfen (tsc --noEmit)
