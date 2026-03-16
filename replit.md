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
- Internet Computer (ICP/DFINITY) Login-Integration
- PWA mit Service Worker & Offline-Support
- 5 Themes (Grandeur, Synthwave, Blockchain, Neon, Forest)
- Privacy-Modus (Daten unscharf)

## Tech Stack
- **Frontend**: React 19, TypeScript
- **Build**: Vite 6 + @tailwindcss/vite (Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 mit CSS Custom Properties Themes
- **Charts**: Recharts (npm, kein CDN)
- **AI**: Google Gemini API (@google/genai)
- **Blockchain**: DFINITY/ICP agent, auth-client, candid, principal
- **Date**: date-fns v4

## Projektstruktur
- `App.tsx` – Root-Komponente, Navigation, Mobile-Nav
- `index.tsx` – Einstiegspunkt, CSS-Import, Service Worker
- `index.css` – Tailwind v4 Import + @theme inline (CSS-Variable-Mapping)
- `index.html` – HTML-Shell, Theme-Styles, PWA-Tags
- `sw.js` – Service Worker (Cache-Strategie)
- `components/` – Dashboard, Header, TransactionList, RightSidebar, UpcomingBills
- `components/modals/` – ModalManager (alle Modals)
- `components/ui.tsx` – UI-Komponenten (Modal, Input, Button...)
- `context/AppContext.tsx` – Globaler State (useReducer + localStorage)
- `hooks/` – useDashboardStats, useReportsData, useFilteredTransactions, useLocalStorage
- `services/ic.ts` – Internet Computer Service
- `utils/` – financialUtils, formatCurrency, etc.
- `types.ts` – TypeScript Typen

## Konfiguration
- Dev-Server: `0.0.0.0:5000`, `allowedHosts: true`
- Deployment: Static Site (`npm run build` → `dist/`)
- Tailwind CSS v4 via `@tailwindcss/vite` Plugin

## Umgebungsvariablen
- `GEMINI_API_KEY` – Für KI-Features (Belegscan, Analyse)

## Befehle
- `npm run dev` – Entwicklungsserver starten
- `npm run build` – Produktions-Build erstellen
- `npm run lint` – TypeScript prüfen (tsc --noEmit)
