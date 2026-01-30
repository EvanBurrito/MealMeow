export type Gender = 'male' | 'female';
export type ActivityLevel = 'normal' | 'inactive' | 'active';
export type Goal = 'maintain' | 'lose' | 'gain';
export type FoodType = 'dry' | 'wet';
export type LifeStage = 'kitten' | 'adult' | 'senior' | 'all';
export type HealthCondition =
  | 'weight_management'
  | 'sensitive_stomach'
  | 'urinary_health'
  | 'hairball_control'
  | 'dental_health'
  | 'skin_coat'
  | 'joint_support'
  | 'kidney_support'
  | 'diabetic';

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
  health_conditions: HealthCondition[];
  profile_image_url: string | null;
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
  servings_per_unit: number;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  moisture_pct: number;
  special_benefits: string[];
  is_complete_balanced: boolean;
  image_url: string | null;
  flavour: string | null;
  purchase_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
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

export interface RecommendationScore {
  overall: number;
  nutritionScore: number;
  valueScore: number;
  suitabilityScore: number;
  breakdown: {
    dryMatterProtein: number;
    fatToProteinRatio: number;
    fiberLevel: number;
    healthConditionMatch: number;
    costEfficiency: number;
    lifeStageMatch: number;
  };
}

export type BadgeType = 'best_value' | 'best_nutrition' | 'best_match' | 'budget_pick';

export interface FoodRecommendation {
  food: CatFood;
  dailyAmount: number;
  amountUnit: string;
  amountPerMeal: number;
  dailyCost: number;
  monthlyCost: number;
  costPer100kcal: number;
  score: RecommendationScore;
  badges: BadgeType[];
}

// Analytics Types
export type AnalyticsEventType =
  | 'recommendation_view'
  | 'recommendation_click'
  | 'filter_change'
  | 'food_detail_view'
  | 'feedback_submitted';

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  cat_id: string | null;
  event_type: AnalyticsEventType;
  event_data: Record<string, unknown>;
  food_id: string | null;
  session_id: string | null;
  created_at: string;
}

// Feedback Types
export type FeedbackType = 'purchased' | 'tried' | 'interested' | 'not_interested';

export interface RecommendationFeedback {
  id: string;
  user_id: string;
  cat_id: string;
  food_id: string;
  rating: number | null;
  feedback_type: FeedbackType;
  comment: string | null;
  cat_liked: boolean | null;
  would_repurchase: boolean | null;
  created_at: string;
  updated_at: string;
}

// User Submission Types
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface UserSubmittedFood {
  id: string;
  submitted_by: string;

  // Food data (mirrors CatFood)
  brand: string;
  product_name: string;
  food_type: FoodType;
  life_stage: LifeStage;
  kcal_per_cup: number | null;
  kcal_per_can: number | null;
  can_size_oz: number | null;
  price_per_unit: number;
  unit_size: string;
  servings_per_unit: number;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  moisture_pct: number;
  special_benefits: string[];
  is_complete_balanced: boolean;
  image_url: string | null;
  flavour: string | null;
  purchase_url: string | null;

  // Submission metadata
  status: SubmissionStatus;
  source_url: string | null;
  nutrition_label_url: string | null;
  notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_food_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface FoodSubmissionForm {
  brand: string;
  product_name: string;
  food_type: FoodType;
  life_stage: LifeStage;
  kcal_per_cup?: number;
  kcal_per_can?: number;
  can_size_oz?: number;
  price_per_unit: number;
  unit_size: string;
  servings_per_unit: number;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  moisture_pct: number;
  special_benefits: string[];
  is_complete_balanced: boolean;
  flavour?: string;
  purchase_url?: string;
  source_url?: string;
  nutrition_label_url?: string;
  notes?: string;
}
