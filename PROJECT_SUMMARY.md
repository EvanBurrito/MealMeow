# Project Summary - MealMeow

## System Overview

MealMeow is a full-stack cat food recommendation application. It calculates a cat's daily caloric needs using veterinary formulas and recommends appropriate foods based on life stage, health conditions, and budget.

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| Next.js App Router | Page routing, Server Components, API handling |
| Supabase Auth | User authentication (email/password) |
| Supabase PostgreSQL | Data persistence with Row Level Security |
| Middleware | Route protection, session management |
| Nutrition Library | Calorie calculations (RER/DER), recommendation generation |
| Scoring Library | Multi-factor food scoring algorithm |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ middleware  │→ │ App Router  │→ │ Server Components   │  │
│  │ (auth gate) │  │ (routing)   │  │ (data fetch/render) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              lib/                                    │    │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │    │
│  │  │ nutrition  │ │  scoring   │ │ supabase/server  │ │    │
│  │  │ (formulas) │ │ (ranking)  │ │ (db client)      │ │    │
│  │  └────────────┘ └────────────┘ └──────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  Auth Service   │  │  PostgreSQL + RLS                │  │
│  │  (JWT tokens)   │  │  profiles, cats, cat_foods, etc. │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### Request -> Processing -> Storage -> Response

1. **Request arrives** at Next.js server
2. **Middleware** (`src/middleware.ts`) intercepts:
   - Creates Supabase client with request cookies
   - Calls `supabase.auth.getUser()` to validate session
   - Redirects unauthenticated users from protected routes to `/auth/login`
   - Redirects authenticated users from auth pages to `/dashboard`
3. **Server Component** executes (e.g., `dashboard/page.tsx`):
   - Creates server Supabase client via `createClient()`
   - Fetches user-specific data with automatic RLS filtering
   - Renders React component with data
4. **Response** sent as HTML with hydration data

### Recommendation Generation Flow

```
Cat Profile → calculateNutritionPlan() → generateRecommendations() → UI
     │                  │                         │
     │                  ▼                         │
     │         RER = 70 × (kg^0.75)              │
     │         DER = RER × life_stage_factor      │
     │                                            │
     └──────────────────┬─────────────────────────┘
                        ▼
              Filter foods by:
              - Life stage compatibility
              - Health condition requirements
              - Budget constraints
              - Complete & balanced status
                        │
                        ▼
              Score each food:
              - Nutrition score (protein, fat, fiber)
              - Value score (cost per 100kcal)
              - Suitability score (health matches)
                        │
                        ▼
              Sort by overall score
              Assign badges (best_value, best_match, etc.)
```

## Key Modules

### 1. `src/lib/nutrition.ts`
**What**: Core calorie and recommendation calculations
**Why**: Contains validated veterinary formulas for cat nutrition
**Key exports**:
- `calculateRER()` - Resting Energy Requirement
- `calculateNutritionPlan()` - Full calorie plan for a cat
- `generateRecommendations()` - Main recommendation engine
- `isLifeStageAppropriate()` - Age-based food filtering
- `isHealthConditionCompatible()` - Health-based food scoring

### 2. `src/lib/scoring.ts`
**What**: Multi-factor food scoring algorithm
**Why**: Determines food rankings and badge assignments
**Key exports**:
- `calculateRecommendationScore()` - Returns overall + breakdown scores
- `determineBadges()` - Assigns best_value, best_match, etc.

### 3. `src/lib/constants.ts`
**What**: Application configuration and reference data
**Why**: Single source of truth for dropdowns, health conditions, food benefits
**Key exports**:
- `CAT_BREEDS`, `ACTIVITY_LEVELS`, `GOALS`, `FOOD_TYPES`
- `HEALTH_CONDITIONS` - With descriptions
- `HEALTH_CONDITION_REQUIREMENTS` - Nutritional constraints per condition

### 4. `src/lib/supabase/server.ts`
**What**: Server-side Supabase client factory
**Why**: Handles cookie-based auth for Server Components
**Usage**: `const supabase = await createClient()`

### 5. `src/middleware.ts`
**What**: Edge middleware for route protection
**Why**: Secures protected routes before page render
**Protected**: `/dashboard/*`, `/cats/*`

### 6. `src/types/index.ts`
**What**: TypeScript type definitions
**Why**: Single source for all interfaces
**Key types**: `Cat`, `CatFood`, `NutritionPlan`, `FoodRecommendation`, `RecommendationScore`

### 7. `src/app/dashboard/page.tsx`
**What**: Main user dashboard
**Why**: Entry point after login, shows cat list
**Pattern**: Server Component with Supabase data fetching

### 8. `src/components/ui/`
**What**: Reusable UI primitives
**Why**: Consistent styling across app
**Contains**: Button, Card, Input, Select, ImageUpload

### 9. `supabase/schema.sql`
**What**: Complete database schema
**Why**: Single-file database setup with RLS policies
**Tables**: profiles, cats, cat_foods, analytics_events, recommendation_feedback, user_submitted_foods

## External Dependencies & Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Supabase | Auth + Database | `.env.local` (URL + anon key) |
| Vercel | Hosting | `vercel.json` (if exists), env vars in dashboard |

### Database Tables Summary

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User metadata, linked to auth.users | User can read/update own |
| `cats` | Cat profiles with nutrition data | User CRUD own cats |
| `cat_foods` | Food database | All authenticated can read |
| `analytics_events` | Usage tracking | User can insert/read own |
| `recommendation_feedback` | User ratings on foods | User CRUD own feedback |
| `user_submitted_foods` | Community food submissions | User CRUD pending; admins all |

## Testing & Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Production build (catches type errors) |
| `npm run lint` | ESLint checks |

**Note**: No test framework currently configured. `tests-messenger/` appears to be a separate/WIP test setup.

## Deployment Notes

1. **Environment Variables** (set in Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Database Setup**:
   - Run `supabase/schema.sql` in Supabase SQL Editor
   - Optionally run `supabase/seed-foods.sql` for sample data

3. **Build**: Vercel auto-builds on push to main

## Known Risks / Tech Debt

- **No automated tests** - Manual testing only; consider adding Jest + Testing Library
- **No API routes** - All mutations happen client-side via Supabase; may need API routes for complex operations
- **Food data** - Currently relies on manual/user submissions; no external API integration
- **Image handling** - `ImageUpload` component exists but storage setup unclear (likely Supabase Storage)
- **Admin access** - `is_admin` flag on profiles; no documented admin provisioning process

## Quick Reference: Where Do I Change X?

| Change | File(s) |
|--------|---------|
| Add new page | `src/app/[route]/page.tsx` |
| Add new component | `src/components/[domain]/Name.tsx` |
| Add TypeScript type | `src/types/index.ts` |
| Modify nutrition formula | `src/lib/nutrition.ts` |
| Modify scoring algorithm | `src/lib/scoring.ts` |
| Add health condition | `src/lib/constants.ts` (2 places) + `src/types/index.ts` (HealthCondition type) |
| Add food benefit | `src/lib/constants.ts` (SPECIAL_BENEFITS) |
| Add DB table | `supabase/schema.sql` (include RLS!) |
| Protect new route | `src/middleware.ts` (add to pathname checks) |
| Add UI primitive | `src/components/ui/` |
| Change global styles | `src/app/globals.css` |
| Add env variable | `.env.local` + Vercel dashboard |
