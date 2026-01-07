import { Cat, CatFood, NutritionPlan, FoodRecommendation } from '@/types';

// Life stage factors for DER calculation
const LIFE_STAGE_FACTORS = {
  kitten: { factor: 2.5, name: 'Kitten (growing)' },
  adult_neutered: { factor: 1.2, name: 'Adult (neutered)' },
  adult_intact: { factor: 1.4, name: 'Adult (intact)' },
  inactive: { factor: 1.0, name: 'Inactive/Obesity-prone' },
  weight_loss: { factor: 0.8, name: 'Weight loss' },
  active: { factor: 1.6, name: 'Active' },
} as const;

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

/**
 * Calculate Resting Energy Requirement (RER)
 * Formula: RER = 70 * (kg ^ 0.75)
 */
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * Determine the appropriate life stage factor based on cat profile
 */
export function getLifeStageFactor(cat: Cat): { factor: number; name: string } {
  // Kitten (under 12 months)
  if (cat.age_months < 12) {
    return LIFE_STAGE_FACTORS.kitten;
  }

  // Weight loss goal takes priority
  if (cat.goal === 'lose') {
    return LIFE_STAGE_FACTORS.weight_loss;
  }

  // Activity level adjustments
  if (cat.activity_level === 'inactive') {
    return LIFE_STAGE_FACTORS.inactive;
  }

  if (cat.activity_level === 'active') {
    return LIFE_STAGE_FACTORS.active;
  }

  // Default based on neutered status
  if (cat.is_neutered) {
    return LIFE_STAGE_FACTORS.adult_neutered;
  }

  return LIFE_STAGE_FACTORS.adult_intact;
}

/**
 * Calculate Daily Energy Requirement (DER)
 * Formula: DER = RER * life_stage_factor
 */
export function calculateDER(weightLbs: number, factor: number): number {
  const kg = lbsToKg(weightLbs);
  const rer = calculateRER(kg);
  return rer * factor;
}

/**
 * Calculate complete nutrition plan for a cat
 */
export function calculateNutritionPlan(cat: Cat): NutritionPlan {
  const kg = lbsToKg(cat.weight_lbs);
  const rer = calculateRER(kg);
  const { factor, name: factorName } = getLifeStageFactor(cat);
  const der = rer * factor;
  const treatBudget = der * 0.1; // 10% of daily calories for treats

  // Determine meals per day
  let mealsPerDay = 2; // Default for adults
  if (cat.age_months < 12) {
    mealsPerDay = 4; // Kittens need more frequent meals
  } else if (cat.goal === 'lose') {
    mealsPerDay = 3; // More frequent smaller meals for weight loss
  }

  return {
    der: Math.round(der),
    rer: Math.round(rer),
    factor,
    factorName,
    treatBudget: Math.round(treatBudget),
    mealsPerDay,
  };
}

/**
 * Calculate cost per 100 kcal
 */
export function calculateCostPer100kcal(price: number, kcal: number): number {
  if (kcal === 0) return Infinity;
  return (price / kcal) * 100;
}

/**
 * Calculate daily cost based on DER
 */
export function calculateDailyCost(der: number, costPer100kcal: number): number {
  return der * (costPer100kcal / 100);
}

/**
 * Calculate monthly cost
 */
export function calculateMonthlyCost(dailyCost: number): number {
  return dailyCost * 30;
}

/**
 * Get the kcal per unit for a food item
 */
export function getKcalPerUnit(food: CatFood): { kcal: number; unit: string } {
  if (food.food_type === 'dry' && food.kcal_per_cup) {
    return { kcal: food.kcal_per_cup, unit: 'cup' };
  }
  if (food.food_type === 'wet' && food.kcal_per_can) {
    return { kcal: food.kcal_per_can, unit: 'can' };
  }
  return { kcal: 0, unit: 'unit' };
}

/**
 * Determine if a food is appropriate for a cat's life stage
 */
export function isLifeStageAppropriate(food: CatFood, cat: Cat): boolean {
  if (food.life_stage === 'all') return true;

  const isKitten = cat.age_months < 12;
  const isSenior = cat.age_months >= 84; // 7+ years

  if (isKitten && food.life_stage === 'kitten') return true;
  if (isSenior && food.life_stage === 'senior') return true;
  if (!isKitten && !isSenior && food.life_stage === 'adult') return true;

  // Also allow adult food for seniors
  if (isSenior && food.life_stage === 'adult') return true;

  return false;
}

/**
 * Generate food recommendations for a cat
 */
export function generateRecommendations(
  cat: Cat,
  foods: CatFood[],
  options: {
    foodTypePreference?: 'dry' | 'wet' | 'any';
    maxMonthlyBudget?: number;
  } = {}
): FoodRecommendation[] {
  const { foodTypePreference = 'any', maxMonthlyBudget } = options;
  const nutritionPlan = calculateNutritionPlan(cat);

  const recommendations: FoodRecommendation[] = [];

  for (const food of foods) {
    // Filter by food type preference
    if (foodTypePreference !== 'any' && food.food_type !== foodTypePreference) {
      continue;
    }

    // Filter by life stage appropriateness
    if (!isLifeStageAppropriate(food, cat)) {
      continue;
    }

    // Only recommend complete & balanced foods
    if (!food.is_complete_balanced) {
      continue;
    }

    const { kcal, unit } = getKcalPerUnit(food);
    if (kcal === 0) continue;

    const dailyAmount = nutritionPlan.der / kcal;
    const amountPerMeal = dailyAmount / nutritionPlan.mealsPerDay;
    const costPer100kcal = calculateCostPer100kcal(food.price_per_unit, kcal);
    const dailyCost = calculateDailyCost(nutritionPlan.der, costPer100kcal);
    const monthlyCost = calculateMonthlyCost(dailyCost);

    // Filter by budget
    if (maxMonthlyBudget && monthlyCost > maxMonthlyBudget) {
      continue;
    }

    recommendations.push({
      food,
      dailyAmount: Math.round(dailyAmount * 100) / 100,
      amountUnit: unit,
      amountPerMeal: Math.round(amountPerMeal * 100) / 100,
      dailyCost: Math.round(dailyCost * 100) / 100,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      costPer100kcal: Math.round(costPer100kcal * 100) / 100,
    });
  }

  // Sort by cost efficiency (lowest cost per 100kcal first)
  recommendations.sort((a, b) => a.costPer100kcal - b.costPer100kcal);

  return recommendations;
}

/**
 * Format feeding schedule as readable string
 */
export function formatFeedingSchedule(
  mealsPerDay: number,
  amountPerMeal: number,
  unit: string
): string {
  const times = mealsPerDay === 2 ? 'twice' : `${mealsPerDay} times`;
  return `${amountPerMeal.toFixed(2)} ${unit}(s) ${times} daily`;
}

/**
 * Get age display string
 */
export function formatAge(ageMonths: number): string {
  if (ageMonths < 12) {
    return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
  }
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}
