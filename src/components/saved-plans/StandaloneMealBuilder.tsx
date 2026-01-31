'use client';

import { useState, useMemo } from 'react';
import { CatFood, FoodSelection } from '@/types';
import { generateMealPlanSummaryWithMealCount, calculateDailyCostForAmountExported, roundToPracticalPortion } from '@/lib/mealPlanner';
import { getKcalPerUnit } from '@/lib/nutrition';
import Input from '@/components/ui/Input';
import SelectableFoodCard from '@/components/recommendations/SelectableFoodCard';
import StandaloneMealSidebar from './StandaloneMealSidebar';

interface StandaloneMealBuilderProps {
  planName: string;
  targetDer: number;
  mealsPerDay: number;
  foods: CatFood[];
  foodTypeFilter: 'all' | 'wet' | 'dry';
  budgetFilter: string;
  derivedFromWeight?: number;
  derivedFromAge?: number;
  // For edit mode
  initialSelections?: FoodSelection[];
  planId?: string;
}

export default function StandaloneMealBuilder({
  planName,
  targetDer,
  mealsPerDay,
  foods,
  foodTypeFilter,
  budgetFilter,
  derivedFromWeight,
  derivedFromAge,
  initialSelections,
  planId,
}: StandaloneMealBuilderProps) {
  const [selectedFoods, setSelectedFoods] = useState<FoodSelection[]>(initialSelections || []);
  const [searchQuery, setSearchQuery] = useState('');

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
    return generateMealPlanSummaryWithMealCount(selectedFoods, foods, targetDer, mealsPerDay);
  }, [selectedFoods, foods, targetDer, mealsPerDay]);

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

  // Filter and sort foods
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

      // Only complete & balanced foods
      if (!food.is_complete_balanced) {
        return false;
      }

      // Budget filter - estimate monthly cost based on target DER
      if (maxBudget && maxBudget > 0) {
        const portionInfo = portionMap.get(food.id);
        if (portionInfo) {
          if (portionInfo.monthlyCost > maxBudget) {
            return false;
          }
        } else {
          // Not selected, estimate based on full DER
          const { kcal } = getKcalPerUnit(food);
          if (kcal > 0) {
            const dailyAmount = targetDer / kcal;
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

    // Sort: selected first, then by brand/name
    return filtered.sort((a, b) => {
      const aIsSelected = selectedFoodIds.has(a.id);
      const bIsSelected = selectedFoodIds.has(b.id);

      // Selected foods first
      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;

      // Then alphabetically by brand, then name
      const brandCompare = a.brand.localeCompare(b.brand);
      if (brandCompare !== 0) return brandCompare;
      return a.product_name.localeCompare(b.product_name);
    });
  }, [foods, searchQuery, foodTypeFilter, budgetFilter, portionMap, targetDer, selectedFoodIds]);

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
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {selectedFoods.length === 0 ? (
              <>
                <span className="font-medium">Tip:</span> Select foods to build your {mealsPerDay}-meal plan.
                You can use the same food for multiple meals or mix different foods.
              </>
            ) : remainingSlots > 0 ? (
              <>
                <span className="font-medium">Great choice!</span> {remainingSlots} meal slot{remainingSlots > 1 ? 's' : ''} remaining.
                Use +/- in sidebar to adjust meals per food.
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
              <span className="text-blue-600 font-medium ml-2">
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
              const isSelected = selectedFoodIds.has(food.id);
              const noSlotsRemaining = remainingSlots <= 0;
              const mealCount = getMealCount(food.id);
              return (
                <div
                  key={food.id}
                  className="food-card-animate animate-fade-in-up"
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
                    searchQuery={searchQuery}
                    isMaxSelected={noSlotsRemaining}
                    mealCount={mealCount}
                    onAdd={() => handleAddFood(food.id)}
                    onDecrement={() => handleDecrementFood(food.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <StandaloneMealSidebar
          planName={planName}
          targetDer={targetDer}
          mealsPerDay={mealsPerDay}
          summary={summary}
          selectedFoods={selectedFoods}
          onRemoveFood={handleRemoveFood}
          onMealCountChange={handleMealCountChange}
          derivedFromWeight={derivedFromWeight}
          derivedFromAge={derivedFromAge}
          planId={planId}
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
              {totalMealsUsed}/{mealsPerDay} meals
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
  );
}
