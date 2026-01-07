# MealMeow - Cat Food Recommendation App

A personalized cat food recommendation app that calculates your cat's nutritional needs and suggests the best food options based on their profile, your budget, and health goals.

## Features

- **User Authentication**: Sign up and sign in with Supabase Auth
- **Cat Profiles**: Create and manage multiple cat profiles with:
  - Age, weight, breed
  - Gender and neutered status
  - Activity level and weight goals
- **Nutrition Calculator**: Science-based calorie calculations using:
  - RER (Resting Energy Requirement): `70 × (kg^0.75)`
  - DER (Daily Energy Requirement): `RER × life stage factor`
- **Food Recommendations**: Personalized food suggestions with:
  - Daily/monthly cost estimates
  - Feeding schedule (amount per meal)
  - Nutrition breakdown
  - Filter by food type (wet/dry) and budget

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
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
3. Copy `.env.local.example` to `.env.local` and fill in your credentials:

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

- **profiles**: User profiles (linked to Supabase Auth)
- **cats**: Cat profiles with nutritional data
- **cat_foods**: Food database with nutrition info and pricing

See `supabase/schema.sql` for the complete schema with sample data.

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
