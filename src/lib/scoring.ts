import { Cat, CatFood, HealthCondition, RecommendationScore, FoodRecommendation, BadgeType } from '@/types';
import { HEALTH_CONDITION_REQUIREMENTS } from './constants';
import { isLifeStageAppropriate } from './nutrition';

// Scoring weights
const WEIGHTS = {
  nutrition: 0.35,
  value: 0.30,
  suitability: 0.35,
};

/**
 * Calculate dry matter protein percentage for fair comparison
 */
export function getDryMatterProtein(food: CatFood): number {
  const dryMatter = 100 - food.moisture_pct;
  if (dryMatter === 0) return 0;
  return (food.protein_pct / dryMatter) * 100;
}

/**
 * Calculate nutrition score (0-100)
 * Based on dry matter protein, fat-to-protein ratio, fiber level, and completeness
 */
export function calculateNutritionScore(food: CatFood): {
  score: number;
  breakdown: {
    dryMatterProtein: number;
    fatToProteinRatio: number;
    fiberLevel: number;
  };
} {
  let score = 0;

  // Dry matter protein (higher is better for cats, up to ~50%)
  const dryMatterProtein = getDryMatterProtein(food);
  const proteinScore = Math.min(dryMatterProtein / 50, 1) * 40; // Max 40 points
  score += proteinScore;

  // Fat to protein ratio (ideal ~0.4-0.5 for most cats)
  const fatProteinRatio = food.fat_pct / (food.protein_pct || 1);
  const idealRatio = 0.45;
  const ratioDeviation = Math.abs(fatProteinRatio - idealRatio) / 0.3;
  const ratioScore = (1 - Math.min(ratioDeviation, 1)) * 20; // Max 20 points
  score += ratioScore;

  // Fiber (moderate is good, 2-5%)
  let fiberScore = 0;
  if (food.fiber_pct >= 2 && food.fiber_pct <= 5) {
    fiberScore = 20;
  } else if (food.fiber_pct < 2) {
    fiberScore = 14;
  } else {
    fiberScore = 10;
  }
  score += fiberScore;

  // Complete & balanced bonus
  if (food.is_complete_balanced) {
    score += 20;
  }

  return {
    score: Math.round(score),
    breakdown: {
      dryMatterProtein: Math.round(proteinScore),
      fatToProteinRatio: Math.round(ratioScore),
      fiberLevel: Math.round(fiberScore),
    },
  };
}

/**
 * Calculate value score (0-100)
 * Based on cost per 100kcal relative to other options
 */
export function calculateValueScore(
  costPer100kcal: number,
  allCostsPer100kcal: number[]
): { score: number; breakdown: { costEfficiency: number } } {
  if (allCostsPer100kcal.length === 0) {
    return { score: 50, breakdown: { costEfficiency: 50 } };
  }

  const minCost = Math.min(...allCostsPer100kcal);
  const maxCost = Math.max(...allCostsPer100kcal);
  const range = maxCost - minCost;

  if (range === 0) {
    return { score: 100, breakdown: { costEfficiency: 100 } };
  }

  // Lower cost = higher score
  const normalized = 1 - (costPer100kcal - minCost) / range;
  const score = Math.round(normalized * 100);

  return { score, breakdown: { costEfficiency: score } };
}

/**
 * Calculate suitability score (0-100)
 * Based on life stage match, health condition compatibility, and special benefits
 */
export function calculateSuitabilityScore(
  food: CatFood,
  cat: Cat,
  healthConditions: HealthCondition[]
): { score: number; breakdown: { healthConditionMatch: number; lifeStageMatch: number } } {
  let score = 0;
  let lifeStageScore = 0;
  let healthConditionScore = 0;

  // Life stage match (25 points max)
  if (food.life_stage === 'all') {
    lifeStageScore = 20;
  } else if (isLifeStageAppropriate(food, cat)) {
    lifeStageScore = 25;
  }
  score += lifeStageScore;

  // Health condition matches (50 points max)
  if (healthConditions.length > 0) {
    let conditionMatchScore = 0;
    for (const condition of healthConditions) {
      const requirements = HEALTH_CONDITION_REQUIREMENTS[condition];
      if (!requirements) continue;

      // Check required benefits
      const requiredMatches = requirements.requiredBenefits.filter(
        (b) => food.special_benefits.includes(b)
      ).length;
      const totalRequired = requirements.requiredBenefits.length || 1;
      conditionMatchScore += (requiredMatches / totalRequired) * (50 / healthConditions.length);

      // Bonus for preferred benefits
      const preferredMatches = requirements.preferredBenefits.filter(
        (b) => food.special_benefits.includes(b)
      ).length;
      if (preferredMatches > 0) {
        conditionMatchScore += 5 / healthConditions.length;
      }
    }
    healthConditionScore = Math.min(Math.round(conditionMatchScore), 50);
  } else {
    healthConditionScore = 50; // No conditions = automatic full points
  }
  score += healthConditionScore;

  // Special benefits bonus (25 points max)
  const benefitScore = Math.min(food.special_benefits.length * 5, 25);
  score += benefitScore;

  return {
    score: Math.min(Math.round(score), 100),
    breakdown: {
      healthConditionMatch: healthConditionScore,
      lifeStageMatch: lifeStageScore,
    },
  };
}

/**
 * Calculate overall recommendation score (0-100)
 */
export function calculateOverallScore(
  nutritionScore: number,
  valueScore: number,
  suitabilityScore: number
): number {
  return Math.round(
    nutritionScore * WEIGHTS.nutrition +
    valueScore * WEIGHTS.value +
    suitabilityScore * WEIGHTS.suitability
  );
}

/**
 * Calculate complete recommendation score
 */
export function calculateRecommendationScore(
  food: CatFood,
  cat: Cat,
  costPer100kcal: number,
  allCostsPer100kcal: number[],
  healthConditions: HealthCondition[]
): RecommendationScore {
  const nutritionResult = calculateNutritionScore(food);
  const valueResult = calculateValueScore(costPer100kcal, allCostsPer100kcal);
  const suitabilityResult = calculateSuitabilityScore(food, cat, healthConditions);

  const overall = calculateOverallScore(
    nutritionResult.score,
    valueResult.score,
    suitabilityResult.score
  );

  return {
    overall,
    nutritionScore: nutritionResult.score,
    valueScore: valueResult.score,
    suitabilityScore: suitabilityResult.score,
    breakdown: {
      dryMatterProtein: nutritionResult.breakdown.dryMatterProtein,
      fatToProteinRatio: nutritionResult.breakdown.fatToProteinRatio,
      fiberLevel: nutritionResult.breakdown.fiberLevel,
      healthConditionMatch: suitabilityResult.breakdown.healthConditionMatch,
      costEfficiency: valueResult.breakdown.costEfficiency,
      lifeStageMatch: suitabilityResult.breakdown.lifeStageMatch,
    },
  };
}

/**
 * Determine badges for recommendations
 */
export function determineBadges(
  recommendations: FoodRecommendation[]
): Map<string, BadgeType[]> {
  const badgeMap = new Map<string, BadgeType[]>();

  if (recommendations.length === 0) return badgeMap;

  // Initialize all foods with empty badge arrays
  for (const rec of recommendations) {
    badgeMap.set(rec.food.id, []);
  }

  // Best Value: Highest value score
  const bestValue = recommendations.reduce((best, current) =>
    current.score.valueScore > best.score.valueScore ? current : best
  );
  badgeMap.get(bestValue.food.id)!.push('best_value');

  // Best Nutrition: Highest nutrition score
  const bestNutrition = recommendations.reduce((best, current) =>
    current.score.nutritionScore > best.score.nutritionScore ? current : best
  );
  if (bestNutrition.food.id !== bestValue.food.id) {
    badgeMap.get(bestNutrition.food.id)!.push('best_nutrition');
  }

  // Best Match: Highest overall score (only if different from best_value and best_nutrition)
  const bestMatch = recommendations.reduce((best, current) =>
    current.score.overall > best.score.overall ? current : best
  );
  if (
    bestMatch.food.id !== bestValue.food.id &&
    bestMatch.food.id !== bestNutrition.food.id
  ) {
    badgeMap.get(bestMatch.food.id)!.push('best_match');
  }

  // Budget Pick: In lower 25% of cost with good quality (overall score >= 70)
  const sortedByCost = [...recommendations].sort(
    (a, b) => a.costPer100kcal - b.costPer100kcal
  );
  const budgetThresholdIndex = Math.ceil(recommendations.length * 0.25);
  const budgetPicks = sortedByCost.slice(0, budgetThresholdIndex);

  for (const pick of budgetPicks) {
    const badges = badgeMap.get(pick.food.id)!;
    if (
      pick.score.overall >= 70 &&
      !badges.includes('best_value') &&
      badges.length === 0
    ) {
      badges.push('budget_pick');
    }
  }

  return badgeMap;
}
