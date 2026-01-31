'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cat, NutritionPlan } from '@/types';
import { MealPlanSummaryWithMealCount, SelectedFoodPortionWithMealCount } from '@/lib/mealPlanner';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';

interface MealBuilderSidebarProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
  summary: MealPlanSummaryWithMealCount;
  onRemoveFood: (foodId: string) => void;
  onMealCountChange: (foodId: string, delta: number) => void;
  mealsPerDay: number;
  onMealsPerDayChange: (meals: number) => void;
}

export default function MealBuilderSidebar({
  cat,
  nutritionPlan,
  summary,
  onRemoveFood,
  onMealCountChange,
  mealsPerDay,
  onMealsPerDayChange,
}: MealBuilderSidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { foods, totalKcal, targetKcal, difference, percentDifference, totalDailyCost, totalMonthlyCost, isValid, message, totalMealsUsed } = summary;
  const remainingSlots = mealsPerDay - totalMealsUsed;

  // Calculate progress bar percentage (capped at 120% for display)
  const progressPercent = Math.min(120, (totalKcal / targetKcal) * 100);

  // Determine progress bar color
  const getProgressColor = () => {
    const absDiff = Math.abs(percentDifference);
    if (absDiff <= 5) return 'bg-green-500';
    if (absDiff <= 15) return 'bg-yellow-500';
    if (percentDifference > 0) return 'bg-orange-500';
    return 'bg-red-400';
  };

  const handleSave = async () => {
    if (!isValid || foods.length === 0) return;
    setIsLoading(true);
    setError('');

    try {
      // Primary food is the first one, secondary is the second (if exists)
      const primaryFood = foods[0];
      const secondaryFood = foods.length > 1 ? foods[1] : null;

      const updateData: {
        selected_food_id: string;
        primary_food_amount: number;
        secondary_food_id: string | null;
        secondary_food_amount: number | null;
        meals_per_day: number;
        food_plan_selected_at: string;
      } = {
        selected_food_id: primaryFood.food.id,
        primary_food_amount: primaryFood.dailyAmount,
        secondary_food_id: secondaryFood?.food.id ?? null,
        secondary_food_amount: secondaryFood?.dailyAmount ?? null,
        meals_per_day: mealsPerDay,
        food_plan_selected_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('cats')
        .update(updateData)
        .eq('id', cat.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving meal plan:', JSON.stringify(err, null, 2));
      const pgError = err as { message?: string; code?: string; details?: string; hint?: string };
      if (pgError?.message) {
        if (pgError.message.includes('column') || pgError.code === '42703') {
          setError('Database migration needed. Run: supabase/migrations/20240131_add_combo_meal_support.sql');
        } else {
          setError(pgError.message);
        }
      } else if (pgError?.code) {
        setError(`Database error (${pgError.code}). Run the combo meal migration.`);
      } else {
        // Check if columns are missing by trying simpler update
        setError('Database columns missing. Please run the combo meal migration in Supabase.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-4">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Your Meal Plan</h3>
        <p className="text-sm text-gray-500">for {cat.name}</p>
      </div>

      {/* Calorie Counter */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-3xl font-bold text-gray-900">{totalKcal}</span>
            <span className="text-gray-500 ml-1">/ {targetKcal} kcal</span>
          </div>
          <span
            className={`text-sm font-medium ${
              Math.abs(percentDifference) <= 5
                ? 'text-green-600'
                : percentDifference > 0
                  ? 'text-orange-600'
                  : 'text-red-500'
            }`}
          >
            {difference > 0 ? '+' : ''}{difference} kcal
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        {/* Status message */}
        <p className={`text-sm ${isValid ? 'text-gray-600' : 'text-red-600'}`}>
          {message}
        </p>
      </div>

      {/* Selected Foods - height adjusts based on meals per day */}
      <div className={`p-4 border-b border-gray-100 overflow-y-auto ${
        mealsPerDay <= 3 ? 'max-h-none' : mealsPerDay <= 4 ? 'max-h-96' : 'max-h-80'
      }`}>
        {foods.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm">Select foods to add to your plan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {foods.map((portion: SelectedFoodPortionWithMealCount) => (
              <div
                key={portion.food.id}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                    <SafeImagePreview
                      src={portion.food.image_url || ''}
                      alt={portion.food.product_name}
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {portion.food.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {portion.kcal} kcal · ${portion.dailyCost.toFixed(2)}/day
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFood(portion.food.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Meal count controls */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-600">
                    {portion.dailyAmount} {portion.unit}(s)/day
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (portion.mealCount <= 1) {
                          onRemoveFood(portion.food.id);
                        } else {
                          onMealCountChange(portion.food.id, -1);
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-600 transition-colors text-sm font-medium"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium text-orange-600 min-w-[60px] text-center">
                      × {portion.mealCount} meal{portion.mealCount > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMealCountChange(portion.food.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors text-sm font-medium"
                      disabled={remainingSlots <= 0}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Slot counter */}
        {foods.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Meal slots</span>
              <span className={`font-medium ${remainingSlots === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {totalMealsUsed}/{mealsPerDay} filled
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cost Summary */}
      {foods.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Daily cost</span>
            <span className="font-medium text-gray-900">${totalDailyCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Monthly cost</span>
            <span className="font-bold text-green-600">${totalMonthlyCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Per Meal Preview */}
      {foods.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Per meal breakdown</p>
          <div className="space-y-1">
            {foods.map((portion: SelectedFoodPortionWithMealCount) => (
              <div key={portion.food.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[120px]">{portion.food.brand}</span>
                <span className="font-medium text-orange-600">
                  {Math.round((portion.dailyAmount / portion.mealCount) * 100) / 100} {portion.unit}/meal
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="p-4">
        <Button
          onClick={handleSave}
          isLoading={isLoading}
          disabled={!isValid || foods.length === 0}
          className="w-full"
        >
          {foods.length === 0 ? 'Select Foods' : 'Save Meal Plan'}
        </Button>
      </div>
    </div>
  );
}
