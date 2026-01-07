export type Gender = 'male' | 'female';
export type ActivityLevel = 'normal' | 'inactive' | 'active';
export type Goal = 'maintain' | 'lose' | 'gain';
export type FoodType = 'dry' | 'wet';
export type LifeStage = 'kitten' | 'adult' | 'senior' | 'all';

export interface Cat {
  id: string;
  user_id: string;
  name: string;
  weight_lbs: number;
  age_months: number;
  gender: Gender;
  is_neutered: boolean;
  breed: string;
  activity_level: ActivityLevel;
  goal: Goal;
  created_at: string;
}

export interface CatFood {
  id: string;
  brand: string;
  product_name: string;
  food_type: FoodType;
  life_stage: LifeStage;
  kcal_per_cup: number | null;
  kcal_per_can: number | null;
  can_size_oz: number | null;
  price_per_unit: number;
  unit_size: string;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  moisture_pct: number;
  special_benefits: string[];
  is_complete_balanced: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface NutritionPlan {
  der: number;
  rer: number;
  factor: number;
  factorName: string;
  treatBudget: number;
  mealsPerDay: number;
}

export interface FoodRecommendation {
  food: CatFood;
  dailyAmount: number;
  amountUnit: string;
  amountPerMeal: number;
  dailyCost: number;
  monthlyCost: number;
  costPer100kcal: number;
}
