# Growth CRM

A CRM for the Growth social media agency. It tracks leads from first contact through to a signed retainer.

- **Leads**: a searchable, sortable table. You can filter by stage, owner, source and overdue follow-up, and export the current view to CSV. Click any lead to open it in a drawer, where you can edit it, change its stage, log calls, emails, meetings and notes, or delete it.
- **Pipeline**: a board with one column per stage. Each column shows its monthly value and win probability. Drag a card to move it to another stage, or focus the card and press Alt plus the left or right arrow key. Won and Lost show the last 90 days.
- **Analytics**: monthly revenue signed, weighted forecast, win rate, average retainer, days to close and new leads. It also has a stage breakdown, new leads per month, new revenue per month, source performance, service mix and team performance. You can filter by period and owner, and every chart can be switched to a table.

Deal values are **monthly retainers** in USD. The weighted forecast multiplies each open deal by its stage's probability: New 10%, Contacted 20%, Qualified 40%, Proposal 60%, Negotiation 80%. You can change these in `src/data/types.ts`.

## Run it

```bash
cd crm
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (analytics + data reducer)
npm run build      # production build to crm/dist
```

Requires Node 20.19+ (or 22.12+).

## Data

The app starts with 68 mock leads, generated from a fixed seed in `src/data/seed.ts` so the data is the same on every load. Changes are saved in the browser's localStorage. Use **Reset demo data** in the sidebar to return to the original set.

All reads and writes go through `src/data/LeadsProvider.tsx`. When you add a backend (for example Supabase, Firebase or your own API), replace `load`/`save` and the dispatch calls there with API calls. The pages don't need to change.

## Hosting

`npm run build` produces a static site in `crm/dist`. The app uses real URLs (`/leads`, `/pipeline`, `/analytics`), so the host has to serve `index.html` for unknown paths. That fallback is already configured for Netlify (`public/_redirects`) and Vercel (`vercel.json`). Set the project root to `crm`.

## Structure

```
src/
  data/        types, mock data, reducer, provider (persistence)
  lib/         analytics math, formatting, CSV export, hooks
  components/  layout, lead drawer and form, charts
  pages/       Leads, Pipeline, Analytics
  styles/      design tokens (global.css) and per-area styles
```
