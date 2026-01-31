# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MealMeow is a cat food recommendation app that calculates personalized nutrition requirements based on veterinary formulas and recommends foods from a database. Built with Next.js 16 (App Router), React 19, Supabase (auth + PostgreSQL), and Tailwind CSS v4.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Start production server
```

## Architecture

**Routing:** Next.js App Router with Server Components by default. Client Components marked with `'use client'`.

**Auth Flow:** Supabase Auth with cookie-based sessions. `middleware.ts` protects routes and handles redirects. Protected routes: `/dashboard/*`, `/cats/*`, `/admin/*`, `/saved-plans/*`.

**Database Access:**
- Server Components: `import { createClient } from '@/lib/supabase/server'`
- Client Components: `import { createClient } from '@/lib/supabase/client'`
- All queries filtered by Row Level Security (RLS) policies

**Key Directories:**
- `src/app/` - Pages and API routes
- `src/components/ui/` - Reusable primitives (Button, Card, Input, Select, Modal)
- `src/components/[domain]/` - Feature components (cats, foods, recommendations, admin)
- `src/lib/` - Business logic and utilities
- `src/types/index.ts` - All TypeScript interfaces
- `supabase/` - Schema, migrations, seed data

## Core Business Logic

**Nutrition Formulas** (`src/lib/nutrition.ts`):
- RER = 70 × (weight_kg)^0.75
- DER = RER × life_stage_factor (kitten: 2.5, adult neutered: 1.2, weight loss: 0.8)
- `calculateSimpleDER(weightLbs, ageMonths)` - Simplified DER calculation without full cat profile

**Meal Planning** (`src/lib/mealPlanner.ts`):
- `generateMealPlanSummaryWithMealCount()` - Calculate portions for multi-food meal plans
- `roundToPracticalPortion()` - Round to practical serving sizes (0.25 cups, 0.5 cans)
- `calculateDailyCostForAmountExported()` - Cost calculations for meal plans

**Food Scoring** (`src/lib/scoring.ts`):
- Weights: Nutrition 35%, Value 30%, Suitability 35%
- Generates badges: best_value, best_nutrition, best_match, budget_pick

**Constants** (`src/lib/constants.ts`):
- CAT_BREEDS, ACTIVITY_LEVELS, GOALS, HEALTH_CONDITIONS
- HEALTH_CONDITION_REQUIREMENTS maps conditions to nutritional needs

## Database Tables

- `profiles` - User accounts (has `is_admin` boolean for admin access)
- `cats` - Cat profiles with health_conditions array
- `cat_foods` - Food database with nutrition data
- `recommendation_feedback` - User ratings on foods
- `analytics_events` - Usage tracking
- `user_submitted_foods` - Community food submissions (admin approval workflow)
- `saved_meal_plans` - User-created meal plans without cat profiles (JSONB food_selections)

## Admin System

Admin users determined by `profiles.is_admin = true`. Admin routes at `/admin/*` check this flag and redirect non-admins to dashboard. The `is_admin()` SQL function (SECURITY DEFINER) is used to avoid RLS recursion.

## Saved Plans Feature

Allows users to create meal plans without a full cat profile. Located at `/saved-plans/*`.

**Components** (`src/components/saved-plans/`):
- `CreatePlanModal` - Setup modal with calorie input (direct or calculated from weight/age)
- `StandaloneMealBuilder` - Food selection grid adapted from BuildOwnPlanView
- `StandaloneMealSidebar` - Plan summary with save action

**Dashboard Components** (`src/components/dashboard/`):
- `SavedPlansSection` - Container with plan list and create button
- `SavedPlanCard` - Display card for saved plans with edit/delete actions

**Data Flow**:
1. User enters plan name + target calories (direct or via weight/age calculation)
2. Navigate to `/saved-plans/new` with params
3. Select foods and assign meal counts
4. Save to `saved_meal_plans` table with user_id

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Common Modifications

| Task | Location |
|------|----------|
| Add new page | `src/app/[route]/page.tsx` |
| Add component | `src/components/[domain]/Name.tsx` |
| Add/modify type | `src/types/index.ts` |
| Add health condition | `src/lib/constants.ts` + `src/types/index.ts` |
| Modify nutrition calc | `src/lib/nutrition.ts` |
| Protect a route | `src/middleware.ts` |
| Add RLS policy | `supabase/migrations/` |

## Cautions

- **middleware.ts** - Auth logic; incorrect changes can lock out users or expose protected routes
- **supabase/schema.sql** - RLS policies; changes affect data security
- **lib/nutrition.ts** - Veterinary formulas; changes affect health recommendations
- Image uploads go to Supabase Storage; remote patterns configured in `next.config.ts`
