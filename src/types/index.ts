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
  selected_food_id: string | null;
  secondary_food_id: string | null;
  primary_food_amount: number | null;
  secondary_food_amount: number | null;
  meals_per_day: number;
  food_plan_selected_at: string | null;
  created_at: string;
  // Community fields
  is_public?: boolean;
  bio?: string | null;
  followers_count?: number;
  show_details_public?: boolean;
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

export interface CatWithFoodPlan extends Cat {
  selected_food?: CatFood | null;
  secondary_food?: CatFood | null;
}

// Meal Planning Types
export interface PortionOption {
  amount: number;
  unit: string;
  kcal: number;
  difference: number;        // From target DER (kcal)
  percentDifference: number; // Percentage difference from target
  practicalityScore: number; // 1.0 = whole number, 0.9 = half, etc.
}

export interface MealPlanOption {
  id: string;
  type: 'single' | 'combo';
  primary: {
    food: CatFood;
    dailyAmount: number;
    unit: string;
    kcal: number;
  };
  complement?: {
    food: CatFood;
    dailyAmount: number;
    unit: string;
    kcal: number;
  };
  totalKcal: number;
  difference: number;       // kcal difference from target DER
  percentDifference: number;
  dailyCost: number;
  monthlyCost: number;
  suitabilityNote: string;
  rank: number;
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

// Build Your Own Plan - Multi-meal selection
export interface FoodSelection {
  foodId: string;
  mealCount: number; // Number of meals this food is used for (1, 2, 3, etc.)
}

// Saved Meal Plans (without full cat profile)
export interface SavedMealPlanFoodSelection {
  foodId: string;
  mealCount: number;
}

export interface SavedMealPlan {
  id: string;
  user_id: string;
  plan_name: string;
  target_der: number;
  derived_from_weight_lbs: number | null;
  derived_from_age_months: number | null;
  meals_per_day: number;
  food_selections: SavedMealPlanFoodSelection[];
  total_kcal: number | null;
  total_daily_cost: number | null;
  total_monthly_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavedMealPlanWithFoods extends SavedMealPlan {
  foods: CatFood[];
}

// =============================================
// Community Types
// =============================================

export type MealPlanCategory =
  | 'indoor'
  | 'outdoor'
  | 'weight_loss'
  | 'weight_gain'
  | 'senior'
  | 'kitten'
  | 'health';

export interface PublicCat extends Cat {
  is_public: boolean;
  bio: string | null;
  followers_count: number;
  isFollowing?: boolean;
}

export interface SharedMealPlan extends SavedMealPlan {
  cat_id: string | null;
  is_shared: boolean;
  category: MealPlanCategory | null;
  health_focus: HealthCondition[];
  likes_count: number;
  saves_count: number;
  uses_count: number;
  shared_at: string | null;
  cat?: PublicCat;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface SharedMealPlanWithFoods extends SharedMealPlan {
  foods: CatFood[];
}

export interface CatFollow {
  id: string;
  follower_user_id: string;
  followed_cat_id: string;
  created_at: string;
}

export interface PlanLike {
  id: string;
  user_id: string;
  plan_id: string;
  created_at: string;
}

export interface PlanSave {
  id: string;
  user_id: string;
  plan_id: string;
  created_at: string;
}
