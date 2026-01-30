# AI Context - MealMeow

## What This Is
- **Purpose**: Cat food recommendation app that calculates nutritional needs (RER/DER) and suggests foods
- **Users**: Cat owners seeking personalized food recommendations based on cat profile, budget, health conditions
- **Output**: Food recommendations with daily amounts, costs, and suitability scores

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Deployment**: Vercel

## Commands
```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Folder Structure (Key Paths)
```
src/
  app/                    # Next.js App Router pages (Server Components)
    auth/                 # Login, signup, password reset
    cats/[id]/            # Cat profile CRUD + recommendations
    dashboard/            # Main user dashboard
    foods/                # Food submission pages
    admin/                # Admin review pages
  components/             # React components
    ui/                   # Reusable primitives (Button, Card, Input, Select)
    cats/                 # Cat-related (CatCard, CatForm)
    recommendations/      # Food recommendation display
  lib/
    supabase/server.ts    # Server-side Supabase client
    supabase/client.ts    # Client-side Supabase client
    nutrition.ts          # Core: calorie calculations, recommendations
    scoring.ts            # Food scoring algorithm
    constants.ts          # App config (breeds, health conditions, etc.)
  types/index.ts          # All TypeScript interfaces
  middleware.ts           # Auth route protection
supabase/
  schema.sql              # Database schema (run in Supabase SQL Editor)
  seed-foods.sql          # Sample food data
```

## Key Flows

### Authentication
- Supabase Auth (email/password)
- `middleware.ts` protects `/dashboard` and `/cats/*` routes
- Server Components use `createClient()` from `lib/supabase/server.ts`
- Client Components use `createBrowserClient()` from `lib/supabase/client.ts`

### Cat Profile -> Recommendations
1. User creates cat profile (weight, age, activity, health conditions)
2. `nutrition.ts:calculateNutritionPlan()` computes RER/DER calories
3. `nutrition.ts:generateRecommendations()` filters foods by life stage, health conditions
4. `scoring.ts:calculateRecommendationScore()` scores each food
5. Results sorted by score, displayed with badges

### Data Persistence
- All data via Supabase client with RLS policies
- Tables: `profiles`, `cats`, `cat_foods`, `analytics_events`, `recommendation_feedback`, `user_submitted_foods`

## Conventions & Patterns
- **Pages**: Server Components (async functions) in `app/` directory
- **DB access**: Always use `createClient()` from appropriate supabase file
- **Components**: UI primitives in `components/ui/`, domain components in named folders
- **Types**: All interfaces in `src/types/index.ts`
- **Styling**: Tailwind utility classes, custom animations in `globals.css`

## DO NOT TOUCH / Be Careful
- `middleware.ts` - Auth logic; changes can lock out users or expose routes
- `supabase/schema.sql` - RLS policies; incorrect changes break security
- `lib/nutrition.ts` - Core business formulas (RER/DER); validated against veterinary standards
- `.env.local` - Contains Supabase keys (never commit)

## Common Tasks

| Task | Where |
|------|-------|
| Add a new page | `src/app/your-route/page.tsx` |
| Add a new component | `src/components/[domain]/ComponentName.tsx` |
| Add a DB table | `supabase/schema.sql` + add RLS policies |
| Add a new type | `src/types/index.ts` |
| Add health condition | `src/lib/constants.ts` (HEALTH_CONDITIONS + HEALTH_CONDITION_REQUIREMENTS) |
| Update env vars | `.env.local` locally, Vercel dashboard for prod |
| Protect a route | Add path pattern to `middleware.ts` matcher |

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```
