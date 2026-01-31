'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Cat, CatFood, MealPlanOption, NutritionPlan } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateMealPlanOptions } from '@/lib/mealPlanner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import NutritionComparisonBar from './NutritionComparisonBar';
import MealPlanOptionCard from './MealPlanOptionCard';

interface BuildMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: CatFood | null;
  cat: Cat;
  nutritionPlan: NutritionPlan;
  availableFoods: CatFood[];
}

interface ModalData {
  food: CatFood;
  options: MealPlanOption[];
}

const MEAL_OPTIONS = [
  { value: 2, label: '2 meals', description: 'Morning & Evening' },
  { value: 3, label: '3 meals', description: 'Morning, Noon & Evening' },
  { value: 4, label: '4 meals', description: 'Every 6 hours' },
];

export default function BuildMealPlanModal({
  isOpen,
  onClose,
  food,
  cat,
  nutritionPlan,
  availableFoods,
}: BuildMealPlanModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedOption, setSelectedOption] = useState<MealPlanOption | null>(null);
  const [mealsPerDay, setMealsPerDay] = useState(cat.meals_per_day || 2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<MealPlanOption[]>([]);

  // Store last valid data for fade-out animation
  const lastDataRef = useRef<ModalData | null>(null);

  // Generate options when food changes
  useEffect(() => {
    if (food) {
      const generatedOptions = generateMealPlanOptions(food, cat, availableFoods);
      setOptions(generatedOptions);
      // Auto-select first option
      if (generatedOptions.length > 0) {
        setSelectedOption(generatedOptions[0]);
      }
      lastDataRef.current = { food, options: generatedOptions };
    }
  }, [food, cat, availableFoods]);

  // Use current or last valid data during fade-out
  const displayData = food ? { food, options } : lastDataRef.current;

  const handleSave = async () => {
    if (!selectedOption || !food) return;
    setIsLoading(true);
    setError('');

    try {
      const updateData: {
        selected_food_id: string;
        primary_food_amount: number;
        secondary_food_id: string | null;
        secondary_food_amount: number | null;
        meals_per_day: number;
        food_plan_selected_at: string;
      } = {
        selected_food_id: selectedOption.primary.food.id,
        primary_food_amount: selectedOption.primary.dailyAmount,
        secondary_food_id: null,
        secondary_food_amount: null,
        meals_per_day: mealsPerDay,
        food_plan_selected_at: new Date().toISOString(),
      };

      // Add secondary food if combo
      if (selectedOption.type === 'combo' && selectedOption.complement) {
        updateData.secondary_food_id = selectedOption.complement.food.id;
        updateData.secondary_food_amount = selectedOption.complement.dailyAmount;
      }

      const { error: updateError } = await supabase
        .from('cats')
        .update(updateData)
        .eq('id', cat.id);

      if (updateError) throw updateError;

      onClose();
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving meal plan:', err);
      const pgError = err as { message?: string; code?: string };
      if (pgError?.message) {
        if (pgError.message.includes('column') || pgError.code === '42703') {
          setError('Database columns missing. Please run the combo meal migration.');
        } else {
          setError(pgError.message);
        }
      } else {
        setError('Failed to save meal plan. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!displayData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="p-6" />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Build Your Meal Plan</h2>
          <p className="text-gray-600 text-sm mt-1">
            Choose a practical feeding option for {cat.name}
          </p>
        </div>

        {/* Selected Food Info */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
            <SafeImagePreview
              src={displayData.food.image_url || ''}
              alt={displayData.food.product_name}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                displayData.food.food_type === 'dry' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {displayData.food.food_type === 'dry' ? 'Dry' : 'Wet'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{displayData.food.product_name}</h3>
            <p className="text-gray-600 text-sm">{displayData.food.brand}</p>
          </div>
        </div>

        {/* Nutrition Comparison */}
        <div className="mb-6">
          <NutritionComparisonBar
            targetKcal={nutritionPlan.der}
            providedKcal={selectedOption?.totalKcal ?? nutritionPlan.der}
          />
        </div>

        {/* Meal Plan Options */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Choose a meal plan</h3>
          {displayData.options.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Unable to generate practical portion options for this food.
            </div>
          ) : (
            <div className="space-y-3">
              {displayData.options.map((option) => (
                <MealPlanOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOption?.id === option.id}
                  onSelect={() => setSelectedOption(option)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Meals Per Day */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How many meals per day?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MEAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMealsPerDay(option.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  mealsPerDay === option.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Per Meal Preview */}
        {selectedOption && (
          <div className="p-4 bg-green-50 rounded-xl mb-6">
            <div className="text-sm text-gray-600 mb-1">Each meal</div>
            {selectedOption.type === 'single' ? (
              <div className="text-xl font-bold text-gray-900">
                {Math.round((selectedOption.primary.dailyAmount / mealsPerDay) * 100) / 100} {selectedOption.primary.unit}(s)
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">
                  {Math.round((selectedOption.primary.dailyAmount / mealsPerDay) * 100) / 100} {selectedOption.primary.unit}(s) {selectedOption.primary.food.food_type}
                </div>
                {selectedOption.complement && (
                  <div className="text-lg font-bold text-gray-900">
                    + {Math.round((selectedOption.complement.dailyAmount / mealsPerDay) * 100) / 100} {selectedOption.complement.unit}(s) {selectedOption.complement.food.food_type}
                  </div>
                )}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {mealsPerDay}x daily = {selectedOption.totalKcal} kcal
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            disabled={!selectedOption}
            className="flex-1"
          >
            Save Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
