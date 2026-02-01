'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cat, CatFood } from '@/types';
import {
  calculateNutritionPlan,
  getKcalPerUnit,
  getTotalKcalPerUnit,
  calculateCostPer100kcal,
  calculateDailyCost,
  calculateMonthlyCost,
} from '@/lib/nutrition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import ShareActivePlanModal from '@/components/community/ShareActivePlanModal';

interface CurrentMealPlanCardProps {
  cat: Cat;
  food: CatFood;
  secondaryFood?: CatFood | null;
  isOwner: boolean;
}

export default function CurrentMealPlanCard({
  cat,
  food,
  secondaryFood,
  isOwner,
}: CurrentMealPlanCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();
  const nutritionPlan = calculateNutritionPlan(cat);
  const mealsPerDay = cat.meals_per_day || 2;
  const isCombo = !!secondaryFood && !!cat.secondary_food_id;
  const isPublic = cat.is_public ?? false;

  // Calculate primary food amounts
  const { kcal: primaryKcal, unit: primaryUnit } = getKcalPerUnit(food);
  const primaryDailyAmount =
    cat.primary_food_amount ??
    Math.round((nutritionPlan.der / primaryKcal) * 100) / 100;
  const primaryAmountPerMeal =
    Math.round((primaryDailyAmount / mealsPerDay) * 100) / 100;

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
    secondaryAmountPerMeal =
      Math.round((secondaryDailyAmount / mealsPerDay) * 100) / 100;
  }

  // Calculate total kcal provided
  const primaryKcalTotal = primaryDailyAmount * primaryKcal;
  const secondaryKcalTotal = secondaryDailyAmount * secondaryKcal;
  const totalKcal = Math.round(primaryKcalTotal + secondaryKcalTotal);

  // Calculate costs
  const primaryTotalKcal = getTotalKcalPerUnit(food);
  const primaryCostPer100kcal = calculateCostPer100kcal(
    food.price_per_unit,
    primaryTotalKcal
  );
  const primaryDailyCost = calculateDailyCost(
    primaryKcalTotal,
    primaryCostPer100kcal
  );

  let secondaryDailyCost = 0;
  if (isCombo && secondaryFood) {
    const secondaryTotalKcal = getTotalKcalPerUnit(secondaryFood);
    const secondaryCostPer100kcal = calculateCostPer100kcal(
      secondaryFood.price_per_unit,
      secondaryTotalKcal
    );
    secondaryDailyCost = calculateDailyCost(
      secondaryKcalTotal,
      secondaryCostPer100kcal
    );
  }

  const totalDailyCost = primaryDailyCost + secondaryDailyCost;
  const monthlyCost = calculateMonthlyCost(totalDailyCost);

  const handleShareClick = () => {
    if (!isPublic) {
      router.push(`/cats/${cat.id}/edit`);
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <>
      <Card variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Current Meal Plan
          </h2>
          {isOwner && (
            <div className="flex gap-2">
              <Link href={`/cats/${cat.id}/recommendations`}>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareClick}
                className={
                  isPublic
                    ? 'text-orange-600 hover:bg-orange-50 hover:border-orange-200'
                    : 'text-gray-400'
                }
                title={
                  isPublic ? 'Share to community' : 'Make profile public to share'
                }
              >
                Share
              </Button>
            </div>
          )}
        </div>

        {/* Food Items */}
        <div className="space-y-3 mb-4">
          {/* Primary Food */}
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
              <SafeImagePreview
                src={food.image_url || ''}
                alt={food.product_name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {food.product_name}
              </p>
              <p className="text-sm text-gray-500">{food.brand}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-orange-600">
                {primaryAmountPerMeal}
              </div>
              <div className="text-xs text-gray-500">
                {primaryUnit}(s)/meal
              </div>
            </div>
          </div>

          {/* Secondary Food (if combo) */}
          {isCombo && secondaryFood && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                <SafeImagePreview
                  src={secondaryFood.image_url || ''}
                  alt={secondaryFood.product_name}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {secondaryFood.product_name}
                </p>
                <p className="text-sm text-gray-500">{secondaryFood.brand}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-blue-600">
                  {secondaryAmountPerMeal}
                </div>
                <div className="text-xs text-gray-500">
                  {secondaryUnit}(s)/meal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
          <span className="text-gray-600">
            {mealsPerDay}x daily · ~{totalKcal} kcal/day
          </span>
          <span className="font-medium text-green-600">
            ${monthlyCost.toFixed(2)}/mo
          </span>
        </div>
      </Card>

      {/* Share Modal - only rendered for owner */}
      {isOwner && (
        <ShareActivePlanModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          cat={cat}
          food={food}
          secondaryFood={secondaryFood}
          onShared={() => {
            setShowShareModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
