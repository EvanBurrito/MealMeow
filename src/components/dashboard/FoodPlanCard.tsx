'use client';

import Link from 'next/link';
import { Cat, CatFood, FoodRecommendation, RecommendationScore } from '@/types';
import { calculateNutritionPlan, getKcalPerUnit, getTotalKcalPerUnit, calculateCostPer100kcal, calculateDailyCost, calculateMonthlyCost } from '@/lib/nutrition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import DownloadPDFButton from '@/components/pdf/DownloadPDFButton';

interface FoodPlanCardProps {
  cat: Cat;
  food: CatFood;
  secondaryFood?: CatFood | null;
}

export default function FoodPlanCard({ cat, food, secondaryFood }: FoodPlanCardProps) {
  const nutritionPlan = calculateNutritionPlan(cat);
  const mealsPerDay = cat.meals_per_day || 2;
  const isCombo = !!secondaryFood && !!cat.secondary_food_id;

  // Calculate primary food amounts
  const { kcal: primaryKcal, unit: primaryUnit } = getKcalPerUnit(food);
  // Use stored amount if available, otherwise calculate
  const primaryDailyAmount = cat.primary_food_amount ?? Math.round((nutritionPlan.der / primaryKcal) * 100) / 100;
  const primaryAmountPerMeal = Math.round((primaryDailyAmount / mealsPerDay) * 100) / 100;

  // Calculate secondary food amounts (if combo)
  let secondaryDailyAmount = 0;
  let secondaryAmountPerMeal = 0;
  let secondaryUnit = '';
  let secondaryKcal = 0;

  if (isCombo && secondaryFood) {
    const secFoodInfo = getKcalPerUnit(secondaryFood);
    secondaryKcal = secFoodInfo.kcal;
    secondaryUnit = secFoodInfo.unit;
    secondaryDailyAmount = cat.secondary_food_amount ?? 0;
    secondaryAmountPerMeal = Math.round((secondaryDailyAmount / mealsPerDay) * 100) / 100;
  }

  // Calculate total kcal provided
  const primaryKcalTotal = primaryDailyAmount * primaryKcal;
  const secondaryKcalTotal = secondaryDailyAmount * secondaryKcal;
  const totalKcal = Math.round(primaryKcalTotal + secondaryKcalTotal);

  // Calculate costs
  const primaryTotalKcal = getTotalKcalPerUnit(food);
  const primaryCostPer100kcal = calculateCostPer100kcal(food.price_per_unit, primaryTotalKcal);
  const primaryDailyCost = calculateDailyCost(primaryKcalTotal, primaryCostPer100kcal);

  let secondaryDailyCost = 0;
  if (isCombo && secondaryFood) {
    const secondaryTotalKcal = getTotalKcalPerUnit(secondaryFood);
    const secondaryCostPer100kcal = calculateCostPer100kcal(secondaryFood.price_per_unit, secondaryTotalKcal);
    secondaryDailyCost = calculateDailyCost(secondaryKcalTotal, secondaryCostPer100kcal);
  }

  const totalDailyCost = primaryDailyCost + secondaryDailyCost;
  const monthlyCost = calculateMonthlyCost(totalDailyCost);

  // Create a FoodRecommendation object for the PDF download (using primary food)
  const dummyScore: RecommendationScore = {
    overall: 0,
    nutritionScore: 0,
    valueScore: 0,
    suitabilityScore: 0,
    breakdown: {
      dryMatterProtein: 0,
      fatToProteinRatio: 0,
      fiberLevel: 0,
      healthConditionMatch: 0,
      costEfficiency: 0,
      lifeStageMatch: 0,
    },
  };

  const primaryRecommendation: FoodRecommendation = {
    food,
    dailyAmount: primaryDailyAmount,
    amountUnit: primaryUnit,
    amountPerMeal: primaryAmountPerMeal,
    dailyCost: primaryDailyCost,
    monthlyCost: isCombo ? monthlyCost : calculateMonthlyCost(primaryDailyCost),
    costPer100kcal: primaryCostPer100kcal,
    score: dummyScore,
    badges: [],
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header with Food Info */}
      <div className="flex items-start gap-3 mb-4">
        {/* Food Image(s) */}
        <div className="flex -space-x-3 flex-shrink-0">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 z-10">
            <SafeImagePreview
              src={food.image_url || ''}
              alt={food.product_name}
              fill
              className="object-contain p-1"
            />
          </div>
          {isCombo && secondaryFood && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
              <SafeImagePreview
                src={secondaryFood.image_url || ''}
                alt={secondaryFood.product_name}
                fill
                className="object-contain p-1"
              />
            </div>
          )}
        </div>

        {/* Food Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Active Plan
            </span>
            {isCombo && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Combo
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 leading-tight truncate" title={isCombo && secondaryFood ? `${food.product_name} + ${secondaryFood.product_name}` : food.product_name}>
            {isCombo && secondaryFood
              ? `${food.product_name} + ${secondaryFood.product_name}`
              : food.product_name}
          </h3>
          <p className="text-gray-600 text-sm">{food.brand}</p>
        </div>
      </div>

      {/* Feeding Schedule */}
      {isCombo ? (
        // Combo meal display
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
              <SafeImagePreview
                src={food.image_url || ''}
                alt={food.product_name}
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{food.product_name}</p>
              <p className="text-xs text-gray-500">{food.brand}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">{primaryAmountPerMeal}</div>
              <div className="text-xs text-gray-500">{primaryUnit}(s)/meal</div>
            </div>
          </div>

          {secondaryFood && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                <SafeImagePreview
                  src={secondaryFood.image_url || ''}
                  alt={secondaryFood.product_name}
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{secondaryFood.product_name}</p>
                <p className="text-xs text-gray-500">{secondaryFood.brand}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-blue-600">{secondaryAmountPerMeal}</div>
                <div className="text-xs text-gray-500">{secondaryUnit}(s)/meal</div>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            {mealsPerDay}x daily
          </div>
        </div>
      ) : (
        // Single food display - same row format as combo
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
              <SafeImagePreview
                src={food.image_url || ''}
                alt={food.product_name}
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{food.product_name}</p>
              <p className="text-xs text-gray-500">{food.brand}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-orange-600">{primaryAmountPerMeal}</div>
              <div className="text-xs text-gray-500">{primaryUnit}(s)/meal</div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            {mealsPerDay}x daily
          </div>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Daily Total</div>
            {isCombo ? (
              <div className="text-lg font-bold text-gray-900">
                {primaryDailyAmount} {primaryUnit}(s) + {secondaryDailyAmount} {secondaryUnit}(s)
              </div>
            ) : (
              <div className="text-lg font-bold text-gray-900">
                {primaryDailyAmount} {primaryUnit}(s)
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Est. Cost</div>
            <div className="text-lg font-bold text-green-600">
              ${monthlyCost.toFixed(2)}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{totalKcal} kcal/day ({nutritionPlan.der} needed)</span>
        <span>${totalDailyCost.toFixed(2)}/day</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/cats/${cat.id}/recommendations`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Change Plan
          </Button>
        </Link>
        <Link href={`/cats/${cat.id}`}>
          <Button variant="outline" size="sm">
            View Cat
          </Button>
        </Link>
        <DownloadPDFButton
          cat={cat}
          nutritionPlan={nutritionPlan}
          recommendation={primaryRecommendation}
        />
      </div>
    </Card>
  );
}
