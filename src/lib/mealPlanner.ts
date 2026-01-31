import { Cat, CatFood, MealPlanOption, PortionOption, NutritionPlan, FoodSelection } from '@/types';
import {
  calculateNutritionPlan,
  getKcalPerUnit,
  getTotalKcalPerUnit,
  calculateCostPer100kcal,
  isLifeStageAppropriate,
  isHealthConditionCompatible,
} from './nutrition';

// Rounding increments by food type
const PORTION_INCREMENTS = {
  wet: 0.5,  // 0.5, 1.0, 1.5, 2.0 cans
  dry: 0.25, // 0.25, 0.5, 0.75, 1.0 cups
} as const;

// Maximum deviation from target DER (20%)
const MAX_DEVIATION_PERCENT = 20;

/**
 * Round an amount to the nearest practical portion
 */
export function roundToPracticalPortion(
  amount: number,
  foodType: 'wet' | 'dry'
): number {
  const increment = PORTION_INCREMENTS[foodType];
  return Math.round(amount / increment) * increment;
}

/**
 * Round down to the nearest practical portion
 */
export function roundDownToPracticalPortion(
  amount: number,
  foodType: 'wet' | 'dry'
): number {
  const increment = PORTION_INCREMENTS[foodType];
  return Math.floor(amount / increment) * increment;
}

/**
 * Round up to the nearest practical portion
 */
export function roundUpToPracticalPortion(
  amount: number,
  foodType: 'wet' | 'dry'
): number {
  const increment = PORTION_INCREMENTS[foodType];
  return Math.ceil(amount / increment) * increment;
}

/**
 * Calculate practicality score for a portion amount
 * Whole numbers are most practical, halves are next, quarters are least
 */
export function calculatePracticalityScore(
  amount: number,
  foodType: 'wet' | 'dry'
): number {
  // Whole numbers are best
  if (amount === Math.floor(amount)) {
    return 1.0;
  }
  // Half portions
  if (amount % 1 === 0.5) {
    return 0.9;
  }
  // Quarter portions (dry food)
  if (foodType === 'dry' && (amount % 1 === 0.25 || amount % 1 === 0.75)) {
    return 0.8;
  }
  // Other fractional amounts
  return 0.7;
}

/**
 * Generate portion options for a food within acceptable calorie range
 */
export function generatePortionOptions(
  food: CatFood,
  targetDer: number,
  mealsPerDay: number = 2
): PortionOption[] {
  const { kcal, unit } = getKcalPerUnit(food);
  if (kcal === 0) return [];

  const exactAmount = targetDer / kcal;
  const minAmount = (targetDer * (1 - MAX_DEVIATION_PERCENT / 100)) / kcal;
  const maxAmount = (targetDer * (1 + MAX_DEVIATION_PERCENT / 100)) / kcal;

  const options: PortionOption[] = [];
  const increment = PORTION_INCREMENTS[food.food_type];
  const seenAmounts = new Set<number>();

  // Generate amounts within range
  for (let amount = Math.floor(minAmount / increment) * increment; amount <= maxAmount; amount += increment) {
    if (amount <= 0 || seenAmounts.has(amount)) continue;
    seenAmounts.add(amount);

    const totalKcal = amount * kcal;
    const difference = totalKcal - targetDer;
    const percentDifference = (difference / targetDer) * 100;

    options.push({
      amount: Math.round(amount * 100) / 100,
      unit,
      kcal: Math.round(totalKcal),
      difference: Math.round(difference),
      percentDifference: Math.round(percentDifference * 10) / 10,
      practicalityScore: calculatePracticalityScore(amount, food.food_type),
    });
  }

  // Sort by: practicality score (desc), then closeness to target
  options.sort((a, b) => {
    const practicalityDiff = b.practicalityScore - a.practicalityScore;
    if (Math.abs(practicalityDiff) > 0.05) return practicalityDiff;
    return Math.abs(a.percentDifference) - Math.abs(b.percentDifference);
  });

  return options;
}

/**
 * Calculate daily cost for a food amount
 */
function calculateDailyCostForAmount(food: CatFood, dailyAmount: number): number {
  const { kcal } = getKcalPerUnit(food);
  const totalKcalPerUnit = getTotalKcalPerUnit(food);
  const costPer100kcal = calculateCostPer100kcal(food.price_per_unit, totalKcalPerUnit);
  const dailyKcal = dailyAmount * kcal;
  return dailyKcal * (costPer100kcal / 100);
}

/**
 * Generate a suitability note for a meal plan option
 */
function generateSuitabilityNote(
  difference: number,
  percentDifference: number,
  type: 'single' | 'combo',
  cat: Cat
): string {
  if (type === 'combo') {
    if (Math.abs(percentDifference) <= 2) {
      return 'Perfectly balanced combo';
    }
    if (percentDifference > 0) {
      return 'Combo with slight calorie surplus';
    }
    return 'Combo with slight calorie deficit';
  }

  if (Math.abs(percentDifference) <= 3) {
    return 'Excellent match';
  }

  if (percentDifference > 10) {
    if (cat.activity_level === 'active' || cat.goal === 'gain') {
      return 'Great for active or growing cats';
    }
    return 'Slight surplus - good for active cats';
  }

  if (percentDifference > 0) {
    return 'Slight calorie surplus';
  }

  if (percentDifference < -10) {
    if (cat.goal === 'lose') {
      return 'Perfect for weight management';
    }
    return 'Calorie deficit - add treats or supplement';
  }

  if (cat.goal === 'lose') {
    return 'Good for gradual weight loss';
  }

  return 'Slight calorie deficit';
}

/**
 * Generate meal plan options for a primary food
 */
export function generateMealPlanOptions(
  primaryFood: CatFood,
  cat: Cat,
  availableFoods: CatFood[],
  maxOptions: number = 4
): MealPlanOption[] {
  const nutritionPlan = calculateNutritionPlan(cat);
  const targetDer = nutritionPlan.der;
  const { kcal: primaryKcal, unit: primaryUnit } = getKcalPerUnit(primaryFood);

  if (primaryKcal === 0) return [];

  const options: MealPlanOption[] = [];
  let optionId = 0;

  // 1. Generate single-food options with practical portions
  const portionOptions = generatePortionOptions(primaryFood, targetDer, nutritionPlan.mealsPerDay);

  for (const portion of portionOptions.slice(0, 3)) {
    const dailyCost = calculateDailyCostForAmount(primaryFood, portion.amount);
    const monthlyCost = dailyCost * 30;

    options.push({
      id: `option-${++optionId}`,
      type: 'single',
      primary: {
        food: primaryFood,
        dailyAmount: portion.amount,
        unit: portion.unit,
        kcal: portion.kcal,
      },
      totalKcal: portion.kcal,
      difference: portion.difference,
      percentDifference: portion.percentDifference,
      dailyCost: Math.round(dailyCost * 100) / 100,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      suitabilityNote: generateSuitabilityNote(
        portion.difference,
        portion.percentDifference,
        'single',
        cat
      ),
      rank: 0,
    });
  }

  // 2. Generate combo options if there's a calorie gap
  // Find complementary foods of the opposite type
  const complementaryType = primaryFood.food_type === 'wet' ? 'dry' : 'wet';
  const complementaryFoods = availableFoods.filter(
    (f) =>
      f.food_type === complementaryType &&
      f.id !== primaryFood.id &&
      f.is_complete_balanced &&
      isLifeStageAppropriate(f, cat) &&
      isHealthConditionCompatible(f, cat.health_conditions || []).compatible
  );

  // For each rounded-down portion, try to fill the gap with a complementary food
  const roundedDownAmount = roundDownToPracticalPortion(
    targetDer / primaryKcal,
    primaryFood.food_type
  );

  if (roundedDownAmount > 0 && complementaryFoods.length > 0) {
    const primaryKcalTotal = roundedDownAmount * primaryKcal;
    const gap = targetDer - primaryKcalTotal;

    if (gap > 20) { // Only create combo if gap is meaningful (>20 kcal)
      // Find best complementary food to fill the gap
      const combos = findComplementaryFoods(gap, complementaryFoods, primaryFood.food_type);

      for (const combo of combos.slice(0, 1)) { // Just take the best combo
        const { kcal: compKcal, unit: compUnit } = getKcalPerUnit(combo.food);
        const compAmount = roundToPracticalPortion(gap / compKcal, combo.food.food_type);

        if (compAmount <= 0) continue;

        const compKcalTotal = compAmount * compKcal;
        const totalKcal = primaryKcalTotal + compKcalTotal;
        const difference = totalKcal - targetDer;
        const percentDifference = (difference / targetDer) * 100;

        // Skip if combo is too far from target
        if (Math.abs(percentDifference) > MAX_DEVIATION_PERCENT) continue;

        const primaryCost = calculateDailyCostForAmount(primaryFood, roundedDownAmount);
        const compCost = calculateDailyCostForAmount(combo.food, compAmount);
        const totalDailyCost = primaryCost + compCost;

        options.push({
          id: `option-${++optionId}`,
          type: 'combo',
          primary: {
            food: primaryFood,
            dailyAmount: roundedDownAmount,
            unit: primaryUnit,
            kcal: Math.round(primaryKcalTotal),
          },
          complement: {
            food: combo.food,
            dailyAmount: compAmount,
            unit: compUnit,
            kcal: Math.round(compKcalTotal),
          },
          totalKcal: Math.round(totalKcal),
          difference: Math.round(difference),
          percentDifference: Math.round(percentDifference * 10) / 10,
          dailyCost: Math.round(totalDailyCost * 100) / 100,
          monthlyCost: Math.round(totalDailyCost * 30 * 100) / 100,
          suitabilityNote: generateSuitabilityNote(difference, percentDifference, 'combo', cat),
          rank: 0,
        });
      }
    }
  }

  // 3. Rank options
  // Priority: combo plans that hit target > single plans close to target > others
  options.sort((a, b) => {
    // Combo that hits target is best
    if (a.type === 'combo' && Math.abs(a.percentDifference) <= 5) return -1;
    if (b.type === 'combo' && Math.abs(b.percentDifference) <= 5) return 1;

    // Then by closeness to target
    const closenessA = Math.abs(a.percentDifference);
    const closenessB = Math.abs(b.percentDifference);

    if (Math.abs(closenessA - closenessB) > 3) {
      return closenessA - closenessB;
    }

    // Then by cost (lower is better)
    return a.dailyCost - b.dailyCost;
  });

  // Assign ranks
  options.forEach((opt, idx) => {
    opt.rank = idx + 1;
  });

  return options.slice(0, maxOptions);
}

/**
 * Find complementary foods to fill a calorie gap
 */
export function findComplementaryFoods(
  gapKcal: number,
  availableFoods: CatFood[],
  primaryType: 'wet' | 'dry'
): Array<{ food: CatFood; amount: number; kcal: number }> {
  const complementaryType = primaryType === 'wet' ? 'dry' : 'wet';

  const results = availableFoods
    .filter((f) => f.food_type === complementaryType)
    .map((food) => {
      const { kcal } = getKcalPerUnit(food);
      if (kcal === 0) return null;

      const exactAmount = gapKcal / kcal;
      const roundedAmount = roundToPracticalPortion(exactAmount, food.food_type);
      const roundedKcal = roundedAmount * kcal;

      return {
        food,
        amount: roundedAmount,
        kcal: roundedKcal,
        deviation: Math.abs(roundedKcal - gapKcal),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && r.amount > 0)
    .sort((a, b) => a.deviation - b.deviation);

  return results.map(({ food, amount, kcal }) => ({ food, amount, kcal }));
}

/**
 * Format a meal plan option for display
 */
export function formatMealPlanDescription(option: MealPlanOption): string {
  if (option.type === 'single') {
    return `${option.primary.dailyAmount} ${option.primary.unit}(s)/day`;
  }

  const { primary, complement } = option;
  return `${primary.dailyAmount} ${primary.unit}(s) + ${complement?.dailyAmount} ${complement?.unit}(s)`;
}

/**
 * Get the increment for a food type
 */
export function getPortionIncrement(foodType: 'wet' | 'dry'): number {
  return PORTION_INCREMENTS[foodType];
}

// ============================================
// Build Your Own Plan - Multi-food utilities
// ============================================

export interface SelectedFoodPortion {
  food: CatFood;
  dailyAmount: number;
  unit: string;
  kcal: number;
  dailyCost: number;
}

export interface MealPlanSummary {
  foods: SelectedFoodPortion[];
  totalKcal: number;
  targetKcal: number;
  difference: number;
  percentDifference: number;
  totalDailyCost: number;
  totalMonthlyCost: number;
  isValid: boolean;
  message: string;
}

/**
 * Calculate portions for multiple selected foods to hit target calories
 * Distributes calories evenly among selected foods, with rounding to practical portions
 */
export function calculateMultiFoodPortions(
  selectedFoods: CatFood[],
  targetDer: number
): SelectedFoodPortion[] {
  if (selectedFoods.length === 0) return [];

  // Split calories evenly among foods
  const caloriesPerFood = targetDer / selectedFoods.length;

  return selectedFoods.map((food) => {
    const { kcal, unit } = getKcalPerUnit(food);
    if (kcal === 0) {
      return {
        food,
        dailyAmount: 0,
        unit,
        kcal: 0,
        dailyCost: 0,
      };
    }

    // Calculate and round to practical portion
    const exactAmount = caloriesPerFood / kcal;
    const roundedAmount = roundToPracticalPortion(exactAmount, food.food_type);
    const actualKcal = roundedAmount * kcal;
    const dailyCost = calculateDailyCostForAmountExported(food, roundedAmount);

    return {
      food,
      dailyAmount: roundedAmount,
      unit,
      kcal: Math.round(actualKcal),
      dailyCost: Math.round(dailyCost * 100) / 100,
    };
  });
}

/**
 * Calculate portions with weighted distribution (e.g., 70% primary, 30% secondary)
 */
export function calculateWeightedPortions(
  selectedFoods: CatFood[],
  targetDer: number,
  weights?: number[]
): SelectedFoodPortion[] {
  if (selectedFoods.length === 0) return [];

  // Default to equal weights if not provided
  const foodWeights = weights && weights.length === selectedFoods.length
    ? weights
    : selectedFoods.map(() => 1 / selectedFoods.length);

  // Normalize weights to sum to 1
  const totalWeight = foodWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = foodWeights.map((w) => w / totalWeight);

  return selectedFoods.map((food, index) => {
    const { kcal, unit } = getKcalPerUnit(food);
    if (kcal === 0) {
      return {
        food,
        dailyAmount: 0,
        unit,
        kcal: 0,
        dailyCost: 0,
      };
    }

    const caloriesForFood = targetDer * normalizedWeights[index];
    const exactAmount = caloriesForFood / kcal;
    const roundedAmount = roundToPracticalPortion(exactAmount, food.food_type);
    const actualKcal = roundedAmount * kcal;
    const dailyCost = calculateDailyCostForAmountExported(food, roundedAmount);

    return {
      food,
      dailyAmount: roundedAmount,
      unit,
      kcal: Math.round(actualKcal),
      dailyCost: Math.round(dailyCost * 100) / 100,
    };
  });
}

/**
 * Exported version of calculateDailyCostForAmount
 */
export function calculateDailyCostForAmountExported(food: CatFood, dailyAmount: number): number {
  const { kcal } = getKcalPerUnit(food);
  const totalKcalPerUnit = getTotalKcalPerUnit(food);
  const costPer100kcal = calculateCostPer100kcal(food.price_per_unit, totalKcalPerUnit);
  const dailyKcal = dailyAmount * kcal;
  return dailyKcal * (costPer100kcal / 100);
}

/**
 * Generate a complete meal plan summary for selected foods
 */
export function generateMealPlanSummary(
  selectedFoods: CatFood[],
  targetDer: number
): MealPlanSummary {
  if (selectedFoods.length === 0) {
    return {
      foods: [],
      totalKcal: 0,
      targetKcal: targetDer,
      difference: -targetDer,
      percentDifference: -100,
      totalDailyCost: 0,
      totalMonthlyCost: 0,
      isValid: false,
      message: 'Select foods to build your meal plan',
    };
  }

  const portions = calculateMultiFoodPortions(selectedFoods, targetDer);
  const totalKcal = portions.reduce((sum, p) => sum + p.kcal, 0);
  const totalDailyCost = portions.reduce((sum, p) => sum + p.dailyCost, 0);
  const difference = totalKcal - targetDer;
  const percentDifference = (difference / targetDer) * 100;

  let message = '';
  let isValid = true;

  if (Math.abs(percentDifference) <= 5) {
    message = 'Perfect! This plan meets your cat\'s calorie needs.';
  } else if (percentDifference > 20) {
    message = 'This plan provides too many calories. Consider removing a food.';
    isValid = false;
  } else if (percentDifference > 5) {
    message = 'Slight calorie surplus. Good for active cats.';
  } else if (percentDifference < -20) {
    message = 'This plan doesn\'t provide enough calories. Add more foods.';
    isValid = false;
  } else if (percentDifference < -5) {
    message = 'Slight calorie deficit. Good for weight management.';
  }

  return {
    foods: portions,
    totalKcal,
    targetKcal: targetDer,
    difference: Math.round(difference),
    percentDifference: Math.round(percentDifference * 10) / 10,
    totalDailyCost: Math.round(totalDailyCost * 100) / 100,
    totalMonthlyCost: Math.round(totalDailyCost * 30 * 100) / 100,
    isValid,
    message,
  };
}

/**
 * Recalculate portions when a food is added or removed
 * This redistributes calories among the remaining foods
 */
export function recalculatePortions(
  currentPortions: SelectedFoodPortion[],
  targetDer: number,
  addFood?: CatFood,
  removeFood?: CatFood
): SelectedFoodPortion[] {
  let foods = currentPortions.map((p) => p.food);

  if (removeFood) {
    foods = foods.filter((f) => f.id !== removeFood.id);
  }

  if (addFood && !foods.find((f) => f.id === addFood.id)) {
    foods.push(addFood);
  }

  return calculateMultiFoodPortions(foods, targetDer);
}

// ============================================
// Quantity-Based Multi-Meal Selection
// ============================================

export interface SelectedFoodPortionWithMealCount extends SelectedFoodPortion {
  mealCount: number;
}

export interface MealPlanSummaryWithMealCount extends Omit<MealPlanSummary, 'foods'> {
  foods: SelectedFoodPortionWithMealCount[];
  totalMealsUsed: number;
}

/**
 * Calculate portions for foods with meal count (quantity-based selection)
 * Distributes calories proportionally based on each food's mealCount
 *
 * Example: 3 meals/day
 * - Dry Food A × 2 meals → gets 2/3 of DER (66%)
 * - Wet Food B × 1 meal → gets 1/3 of DER (33%)
 */
export function calculateWeightedMealPortions(
  selections: FoodSelection[],
  foods: CatFood[],
  targetDer: number
): SelectedFoodPortionWithMealCount[] {
  if (selections.length === 0) return [];

  const totalMeals = selections.reduce((sum, s) => sum + s.mealCount, 0);
  if (totalMeals === 0) return [];

  return selections.map((selection) => {
    const food = foods.find((f) => f.id === selection.foodId);
    if (!food) {
      return {
        food: {} as CatFood,
        dailyAmount: 0,
        unit: 'cup',
        kcal: 0,
        dailyCost: 0,
        mealCount: selection.mealCount,
      };
    }

    const { kcal, unit } = getKcalPerUnit(food);
    if (kcal === 0) {
      return {
        food,
        dailyAmount: 0,
        unit,
        kcal: 0,
        dailyCost: 0,
        mealCount: selection.mealCount,
      };
    }

    // Calculate calorie share based on meal count proportion
    const calorieShare = (selection.mealCount / totalMeals) * targetDer;
    const exactAmount = calorieShare / kcal;
    const roundedAmount = roundToPracticalPortion(exactAmount, food.food_type);
    const actualKcal = roundedAmount * kcal;
    const dailyCost = calculateDailyCostForAmountExported(food, roundedAmount);

    return {
      food,
      dailyAmount: roundedAmount,
      unit,
      kcal: Math.round(actualKcal),
      dailyCost: Math.round(dailyCost * 100) / 100,
      mealCount: selection.mealCount,
    };
  });
}

/**
 * Generate a complete meal plan summary for foods with meal counts
 */
export function generateMealPlanSummaryWithMealCount(
  selections: FoodSelection[],
  foods: CatFood[],
  targetDer: number,
  maxMeals: number
): MealPlanSummaryWithMealCount {
  const totalMealsUsed = selections.reduce((sum, s) => sum + s.mealCount, 0);

  if (selections.length === 0) {
    return {
      foods: [],
      totalKcal: 0,
      targetKcal: targetDer,
      difference: -targetDer,
      percentDifference: -100,
      totalDailyCost: 0,
      totalMonthlyCost: 0,
      isValid: false,
      message: 'Select foods to build your meal plan',
      totalMealsUsed: 0,
    };
  }

  const portions = calculateWeightedMealPortions(selections, foods, targetDer);
  const totalKcal = portions.reduce((sum, p) => sum + p.kcal, 0);
  const totalDailyCost = portions.reduce((sum, p) => sum + p.dailyCost, 0);
  const difference = totalKcal - targetDer;
  const percentDifference = (difference / targetDer) * 100;

  let message = '';
  let isValid = true;

  if (Math.abs(percentDifference) <= 5) {
    message = 'Perfect! This plan meets your cat\'s calorie needs.';
  } else if (percentDifference > 20) {
    message = 'This plan provides too many calories. Consider reducing meals.';
    isValid = false;
  } else if (percentDifference > 5) {
    message = 'Slight calorie surplus. Good for active cats.';
  } else if (percentDifference < -20) {
    message = 'This plan doesn\'t provide enough calories. Add more meals.';
    isValid = false;
  } else if (percentDifference < -5) {
    message = 'Slight calorie deficit. Good for weight management.';
  }

  return {
    foods: portions,
    totalKcal,
    targetKcal: targetDer,
    difference: Math.round(difference),
    percentDifference: Math.round(percentDifference * 10) / 10,
    totalDailyCost: Math.round(totalDailyCost * 100) / 100,
    totalMonthlyCost: Math.round(totalDailyCost * 30 * 100) / 100,
    isValid,
    message,
    totalMealsUsed,
  };
}
