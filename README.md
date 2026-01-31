# MealMeow - Cat Food Recommendation App

A personalized cat food recommendation app that calculates your cat's nutritional needs and suggests the best food options based on their profile, health conditions, budget, and goals.

## Features

### Core Features
- **User Authentication**: Sign up and sign in with Supabase Auth
- **Cat Profiles**: Create and manage multiple cat profiles with:
  - Age, weight, breed
  - Gender and neutered status
  - Activity level and weight goals
  - Health conditions (diabetes, kidney disease, allergies, etc.)

### Nutrition & Recommendations
- **Nutrition Calculator**: Science-based calorie calculations using veterinary formulas
- **Food Recommendations**: Personalized food suggestions with:
  - Scoring based on nutrition (35%), value (30%), and suitability (35%)
  - Badges: Best Value, Best Nutrition, Best Match, Budget Pick
  - Daily/monthly cost estimates
  - Feeding schedule with practical portion sizes

### Meal Planning
- **Multi-Food Meal Plans**: Combine wet and dry foods with portion calculations
- **Build Your Own Plan**: Select foods and assign meals per day
- **Saved Plans**: Create meal plans without a full cat profile (just weight/age or direct calories)

### Admin System
- **Admin Dashboard**: Manage the food database
- **Food Submissions**: Community food submission workflow with approval/rejection
- **Image Upload**: Upload food images to Supabase Storage

### Food Database
- **Browse Foods**: Search and filter the complete food database
- **Submit Foods**: Users can submit new foods for admin approval
- **My Submissions**: Track your submitted foods and their status

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mealmeow.git
cd mealmeow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create `.env.local` with your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the schema SQL in your Supabase SQL Editor:
   - Open `supabase/schema.sql`
   - Copy and paste into Supabase SQL Editor
   - Run the query

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **profiles**: User profiles with `is_admin` flag (linked to Supabase Auth)
- **cats**: Cat profiles with health_conditions array
- **cat_foods**: Food database with nutrition info and pricing
- **recommendation_feedback**: User ratings on foods
- **user_submitted_foods**: Community food submissions (pending/approved/rejected)
- **saved_meal_plans**: User-created meal plans (JSONB food_selections)
- **analytics_events**: Usage tracking

See `supabase/schema.sql` for the complete schema with RLS policies.

## Nutrition Formulas

### Resting Energy Requirement (RER)
```
RER = 70 × (weight_kg ^ 0.75)
```

### Daily Energy Requirement (DER)
```
DER = RER × factor

Factors:
- Kitten: 2.5
- Adult (neutered): 1.2
- Adult (intact): 1.4
- Inactive/obesity-prone: 1.0
- Weight loss: 0.8
```

### Treat Budget
Maximum 10% of daily calories should come from treats.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard & submissions
│   ├── cats/              # Cat profiles & recommendations
│   ├── dashboard/         # User dashboard
│   ├── database/          # Food database browser
│   ├── foods/             # Food submission pages
│   └── saved-plans/       # Standalone meal plans
├── components/
│   ├── admin/             # Admin components
│   ├── cats/              # Cat profile components
│   ├── dashboard/         # Dashboard components
│   ├── foods/             # Food database components
│   ├── recommendations/   # Recommendation & meal plan components
│   ├── saved-plans/       # Standalone plan components
│   └── ui/                # Reusable UI primitives
├── lib/                   # Business logic & utilities
│   ├── nutrition.ts       # Calorie calculations
│   ├── scoring.ts         # Food scoring algorithm
│   ├── mealPlanner.ts     # Meal plan calculations
│   ├── constants.ts       # App constants
│   └── supabase/          # Supabase clients
└── types/                 # TypeScript interfaces
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## License

MIT
