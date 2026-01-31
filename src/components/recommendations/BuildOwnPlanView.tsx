'use client';

import { useState, useMemo } from 'react';
import { Cat, CatFood, NutritionPlan, BadgeType, FoodSelection } from '@/types';
import { generateMealPlanSummaryWithMealCount, calculateDailyCostForAmountExported, roundToPracticalPortion } from '@/lib/mealPlanner';
import { getKcalPerUnit, generateRecommendations } from '@/lib/nutrition';
import { determineBadges } from '@/lib/scoring';
import Input from '@/components/ui/Input';
import SelectableFoodCard from './SelectableFoodCard';
import MealBuilderSidebar from './MealBuilderSidebar';
import FoodDetailModal from './FoodDetailModal';

interface BuildOwnPlanViewProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
  foods: CatFood[];
  foodTypeFilter: 'all' | 'wet' | 'dry';
  budgetFilter: string;
  mealsPerDay: number;
  onMealsPerDayChange: (value: number) => void;
}

export default function BuildOwnPlanView({
  cat,
  nutritionPlan,
  foods,
  foodTypeFilter,
  budgetFilter,
  mealsPerDay,
  onMealsPerDayChange,
}: BuildOwnPlanViewProps) {
  const [selectedFoods, setSelectedFoods] = useState<FoodSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalFood, setDetailModalFood] = useState<CatFood | null>(null);

  // Calculate total meals used
  const totalMealsUsed = useMemo(() => {
    return selectedFoods.reduce((sum, s) => sum + s.mealCount, 0);
  }, [selectedFoods]);

  const remainingSlots = mealsPerDay - totalMealsUsed;

  // Get selected food IDs for quick lookup
  const selectedFoodIds = useMemo(() => {
    return new Set(selectedFoods.map((s) => s.foodId));
  }, [selectedFoods]);

  // Get meal count for a specific food
  const getMealCount = (foodId: string): number => {
    const selection = selectedFoods.find((s) => s.foodId === foodId);
    return selection?.mealCount ?? 0;
  };

  // Calculate meal plan summary
  const summary = useMemo(() => {
    return generateMealPlanSummaryWithMealCount(selectedFoods, foods, nutritionPlan.der, mealsPerDay);
  }, [selectedFoods, foods, nutritionPlan.der, mealsPerDay]);

  // Create a map of food id to calculated portion and cost for quick lookup
  const portionMap = useMemo(() => {
    const map = new Map<string, {
      dailyAmount: number;
      unit: string;
      kcal: number;
      dailyCost: number;
      monthlyCost: number;
      mealCount: number;
    }>();
    summary.foods.forEach((p) => {
      map.set(p.food.id, {
        dailyAmount: p.dailyAmount,
        unit: p.unit,
        kcal: p.kcal,
        dailyCost: p.dailyCost,
        monthlyCost: Math.round(p.dailyCost * 30 * 100) / 100,
        mealCount: p.mealCount,
      });
    });
    return map;
  }, [summary.foods]);

  // Generate recommendations for badge calculation
  const foodRecommendations = useMemo(() => {
    return generateRecommendations(cat, foods, {
      foodTypePreference: 'any',
      healthConditions: cat.health_conditions || [],
    });
  }, [cat, foods]);

  // Create badge map
  const badgeMap = useMemo(() => {
    return determineBadges(foodRecommendations);
  }, [foodRecommendations]);

  // Get primary badge for a food (first badge in array)
  const getPrimaryBadge = (foodId: string): BadgeType | undefined => {
    const badges = badgeMap.get(foodId);
    return badges && badges.length > 0 ? badges[0] : undefined;
  };

  // Calculate complementary recommendations when slots remain unfilled (only after 1+ food selected)
  const complementaryRecommendations = useMemo(() => {
    // No recommendations when all slots are filled or no food selected yet
    if (remainingSlots <= 0 || selectedFoods.length === 0) return null;

    // Get the current selected food objects
    const currentSelectedFoods = selectedFoods
      .map((s) => foods.find((f) => f.id === s.foodId))
      .filter((f): f is CatFood => f !== undefined);

    // Determine what food types are already selected
    const selectedTypes = new Set(currentSelectedFoods.map((f) => f.food_type));

    // Calculate current plan's actual kcal
    const currentKcal = summary.totalKcal;
    const remainingKcal = nutritionPlan.der - currentKcal;

    // Prefer variety: try opposite type if only one type selected
    let candidateFoods: CatFood[];
    if (selectedTypes.size === 1) {
      const selectedType = [...selectedTypes][0];
      const complementaryType = selectedType === 'wet' ? 'dry' : 'wet';
      candidateFoods = foods.filter((f) => f.food_type === complementaryType);

      // Fallback: If no opposite type available, use any food not already selected
      if (candidateFoods.length === 0) {
        candidateFoods = foods.filter((f) => !selectedFoodIds.has(f.id));
      }
    } else {
      // Multiple types already selected, show any food not already selected
      candidateFoods = foods.filter((f) => !selectedFoodIds.has(f.id));
    }

    if (candidateFoods.length === 0) return null;

    // Find best options for pairing
    const recs = generateRecommendations(cat, candidateFoods, {
      foodTypePreference: 'any',
      healthConditions: cat.health_conditions || [],
    });

    if (recs.length === 0) return null;

    // Calculate calories per slot for the remaining slots
    const kcalPerSlot = remainingSlots > 0 ? remainingKcal / remainingSlots : nutritionPlan.der / mealsPerDay;

    // Score all foods with calorie fit and variety bonus
    const scoredRecs = recs.map((r) => {
      const kcalPerUnit = getKcalPerUnit(r.food).kcal;
      const exactAmount = kcalPerSlot / kcalPerUnit;
      const roundedAmount = roundToPracticalPortion(exactAmount, r.food.food_type);
      const actualKcal = roundedAmount * kcalPerUnit;

      // How well does this food fit the remaining calorie gap?
      const calorieFit = Math.abs(actualKcal - kcalPerSlot);

      // Prefer variety (opposite food type from what's selected)
      let varietyBonus = 0;
      if (currentSelectedFoods.length > 0) {
        const hasOppositeType = currentSelectedFoods.every((f) => f.food_type !== r.food.food_type);
        varietyBonus = hasOppositeType ? 10 : 0;
      }

      // Combined score: nutrition + value + variety - calorie deviation
      const combinedScore = r.score.nutritionScore + r.score.valueScore + varietyBonus - (calorieFit / 100);

      return {
        ...r,
        combinedScore,
        calorieFit,
      };
    });

    // Sort by combined score (higher is better)
    scoredRecs.sort((a, b) => b.combinedScore - a.combinedScore);

    // Take top 3
    const recommendedIds = new Set(scoredRecs.slice(0, 3).map((r) => r.food.id));

    return recommendedIds;
  }, [selectedFoods, selectedFoodIds, foods, cat, nutritionPlan.der, mealsPerDay, remainingSlots, summary.totalKcal]);

  // Filter and sort foods - recommended pairs and badged foods first
  const filteredFoods = useMemo(() => {
    const maxBudget = budgetFilter ? parseFloat(budgetFilter) : undefined;

    const filtered = foods.filter((food) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          food.product_name.toLowerCase().includes(query) ||
          food.brand.toLowerCase().includes(query) ||
          (food.flavour && food.flavour.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (foodTypeFilter !== 'all' && food.food_type !== foodTypeFilter) {
        return false;
      }

      // Budget filter - estimate monthly cost based on target DER
      if (maxBudget && maxBudget > 0) {
        // Calculate estimated monthly cost for this food if used alone
        const portionInfo = portionMap.get(food.id);
        if (portionInfo) {
          if (portionInfo.monthlyCost > maxBudget) {
            return false;
          }
        } else {
          // Not selected, estimate based on full DER
          const { kcal } = getKcalPerUnit(food);
          if (kcal > 0) {
            const dailyAmount = nutritionPlan.der / kcal;
            const dailyCost = calculateDailyCostForAmountExported(food, dailyAmount);
            const monthlyCost = dailyCost * 30;
            if (monthlyCost > maxBudget) {
              return false;
            }
          }
        }
      }

      return true;
    });

    // Sort: selected first, then recommended pairs, then badged, then rest
    return filtered.sort((a, b) => {
      const aIsSelected = selectedFoodIds.has(a.id);
      const bIsSelected = selectedFoodIds.has(b.id);
      const aIsRecommended = complementaryRecommendations?.has(a.id) ?? false;
      const bIsRecommended = complementaryRecommendations?.has(b.id) ?? false;
      const aHasBadge = (badgeMap.get(a.id)?.length ?? 0) > 0;
      const bHasBadge = (badgeMap.get(b.id)?.length ?? 0) > 0;

      // Selected foods first
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;

      // Then recommended pairs
      if (aIsRecommended && !bIsRecommended) return -1;
      if (!aIsRecommended && bIsRecommended) return 1;

      // Then badged foods
      if (aHasBadge && !bHasBadge) return -1;
      if (!aHasBadge && bHasBadge) return 1;

      return 0;
    });
  }, [foods, searchQuery, foodTypeFilter, budgetFilter, portionMap, nutritionPlan.der, complementaryRecommendations, badgeMap, selectedFoodIds]);

  const handleAddFood = (foodId: string) => {
    setSelectedFoods((prev) => {
      // Check if slots are available
      const currentTotalMeals = prev.reduce((sum, s) => sum + s.mealCount, 0);
      if (currentTotalMeals >= mealsPerDay) {
        return prev;
      }

      const existingIndex = prev.findIndex((s) => s.foodId === foodId);

      if (existingIndex >= 0) {
        // Food is already selected, increment meal count
        return prev.map((s, i) =>
          i === existingIndex ? { ...s, mealCount: s.mealCount + 1 } : s
        );
      } else {
        // Food is not selected, add it with mealCount: 1
        return [...prev, { foodId, mealCount: 1 }];
      }
    });
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((s) => s.foodId !== foodId));
  };

  const handleDecrementFood = (foodId: string) => {
    setSelectedFoods((prev) => {
      const selection = prev.find((s) => s.foodId === foodId);
      if (!selection) return prev;

      if (selection.mealCount <= 1) {
        // Remove entirely
        return prev.filter((s) => s.foodId !== foodId);
      } else {
        // Decrement by 1
        return prev.map((s) =>
          s.foodId === foodId ? { ...s, mealCount: s.mealCount - 1 } : s
        );
      }
    });
  };

  const handleMealCountChange = (foodId: string, delta: number) => {
    setSelectedFoods((prev) => {
      return prev.map((selection) => {
        if (selection.foodId !== foodId) return selection;

        const newMealCount = selection.mealCount + delta;

        // Don't go below 1 (use remove to delete)
        if (newMealCount < 1) return selection;

        // Don't exceed available slots
        const otherMeals = prev.reduce(
          (sum, s) => (s.foodId !== foodId ? sum + s.mealCount : sum),
          0
        );
        if (otherMeals + newMealCount > mealsPerDay) return selection;

        return { ...selection, mealCount: newMealCount };
      });
    });
  };

  return (
    <>
    <div className="flex gap-6">
      {/* Main content - Food grid */}
      <div className="flex-1">
        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search foods by name, brand, or flavor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Selection hint */}
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            {selectedFoods.length === 0 ? (
              <>
                <span className="font-medium">Tip:</span> Select foods to build your {mealsPerDay}-meal plan.
                You can use the same food for multiple meals or mix different foods.
              </>
            ) : remainingSlots > 0 ? (
              <>
                <span className="font-medium">Great choice!</span> {remainingSlots} meal slot{remainingSlots > 1 ? 's' : ''} remaining.
                {complementaryRecommendations && complementaryRecommendations.size > 0 && (
                  <> We&apos;ve highlighted <span className="text-purple-700 font-medium">best pairing options</span>.</>
                )}
                {' '}Use +/- in sidebar to adjust meals per food.
              </>
            ) : (
              <>
                <span className="font-medium">Perfect!</span> All {mealsPerDay} meal slots filled.
                Review your meal plan in the sidebar and save when ready.
              </>
            )}
          </p>
        </div>

        {/* Food count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredFoods.length} food{filteredFoods.length !== 1 ? 's' : ''} available
            {selectedFoods.length > 0 && (
              <span className="text-orange-600 font-medium ml-2">
                ({selectedFoods.length} food{selectedFoods.length !== 1 ? 's' : ''}, {totalMealsUsed}/{mealsPerDay} meals)
              </span>
            )}
          </p>
          {selectedFoods.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFoods([])}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Food grid */}
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-1">No foods found</h3>
            <p className="text-gray-500 text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredFoods.map((food, index) => {
              const portion = portionMap.get(food.id);
              const isRecommendedPair = complementaryRecommendations?.has(food.id) ?? false;
              const isSelected = selectedFoodIds.has(food.id);
              const noSlotsRemaining = remainingSlots <= 0;
              const mealCount = getMealCount(food.id);
              return (
                <div
                  key={food.id}
                  className={`food-card-animate ${isRecommendedPair && !noSlotsRemaining ? 'animate-fade-in-purple' : 'animate-fade-in-up'}`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    opacity: 0
                  }}
                >
                  <SelectableFoodCard
                    food={food}
                    isSelected={isSelected}
                    portion={portion}
                    mealsPerDay={mealsPerDay}
                    monthlyCost={portion?.monthlyCost}
                    dailyCost={portion?.dailyCost}
                    badge={getPrimaryBadge(food.id)}
                    searchQuery={searchQuery}
                    isRecommendedPair={isRecommendedPair}
                    isMaxSelected={noSlotsRemaining}
                    mealCount={mealCount}
                    onAdd={() => handleAddFood(food.id)}
                    onDecrement={() => handleDecrementFood(food.id)}
                    onCardClick={() => {
                      console.log('Card clicked, food:', food.product_name);
                      setDetailModalFood(food);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <MealBuilderSidebar
          cat={cat}
          nutritionPlan={nutritionPlan}
          summary={summary}
          onRemoveFood={handleRemoveFood}
          onMealCountChange={handleMealCountChange}
          mealsPerDay={mealsPerDay}
          onMealsPerDayChange={onMealsPerDayChange}
        />
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{summary.totalKcal}</span>
              <span className="text-gray-500">/ {summary.targetKcal} kcal</span>
            </div>
            <p className="text-sm text-gray-500">
              {totalMealsUsed}/{mealsPerDay} meals · {selectedFoods.length} food{selectedFoods.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${
              Math.abs(summary.percentDifference) <= 5
                ? 'text-green-600'
                : summary.percentDifference > 0
                  ? 'text-orange-600'
                  : 'text-red-500'
            }`}>
              {summary.difference > 0 ? '+' : ''}{summary.difference} kcal
            </span>
          </div>
        </div>
      </div>

    </div>

    {/* Food Detail Modal */}
    <FoodDetailModal
      isOpen={!!detailModalFood}
      food={detailModalFood}
      nutritionPlan={nutritionPlan}
      dailyAmount={detailModalFood ? (portionMap.get(detailModalFood.id)?.dailyAmount ?? Math.round((nutritionPlan.der / getKcalPerUnit(detailModalFood).kcal) * 100) / 100) : 0}
      amountUnit={detailModalFood ? (portionMap.get(detailModalFood.id)?.unit ?? getKcalPerUnit(detailModalFood).unit) : 'cup'}
      dailyCost={detailModalFood ? (portionMap.get(detailModalFood.id)?.dailyCost ?? 0) : 0}
      monthlyCost={detailModalFood ? (portionMap.get(detailModalFood.id)?.monthlyCost ?? 0) : 0}
      onClose={() => setDetailModalFood(null)}
      onAdd={detailModalFood ? () => handleAddFood(detailModalFood.id) : undefined}
      onDecrement={detailModalFood ? () => handleDecrementFood(detailModalFood.id) : undefined}
      isSelected={detailModalFood ? selectedFoodIds.has(detailModalFood.id) : false}
      mealCount={detailModalFood ? getMealCount(detailModalFood.id) : 0}
      isMaxSelected={remainingSlots <= 0}
    />
    </>
  );
}
