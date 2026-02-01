'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SharedMealPlanWithFoods, CatFood, Cat } from '@/types';
import { getKcalPerUnit, calculateNutritionPlan } from '@/lib/nutrition';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import CatAvatar from './CatAvatar';

interface UsePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SharedMealPlanWithFoods;
}

type SaveMode = 'saved_plan' | 'apply_to_cat';

export default function UsePlanModal({ isOpen, onClose, plan }: UsePlanModalProps) {
  const [saveMode, setSaveMode] = useState<SaveMode>('saved_plan');
  const [planName, setPlanName] = useState(`${plan.plan_name} (Copy)`);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [userCats, setUserCats] = useState<Cat[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user's cats when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCats = async () => {
        const { data } = await supabase
          .from('cats')
          .select('*')
          .order('name');
        if (data) {
          setUserCats(data as Cat[]);
        }
      };
      fetchCats();
    }
  }, [isOpen, supabase]);

  // Get food objects that match the selections
  const foodMap = new Map<string, CatFood>();
  plan.foods.forEach((food) => foodMap.set(food.id, food));

  // Get foods with their meal counts
  const selectedFoods = plan.food_selections
    .map((selection) => ({
      food: foodMap.get(selection.foodId),
      mealCount: selection.mealCount,
    }))
    .filter((item): item is { food: CatFood; mealCount: number } => !!item.food);

  // Calculate amount per meal for each food
  const foodsWithAmounts = selectedFoods.map(({ food, mealCount }) => {
    const { kcal, unit } = getKcalPerUnit(food);
    const totalMeals = plan.food_selections.reduce((sum, s) => sum + s.mealCount, 0);
    const calorieShare = (mealCount / totalMeals) * plan.target_der;
    const dailyAmount = kcal > 0 ? calorieShare / kcal : 0;
    const amountPerMeal = mealCount > 0 ? dailyAmount / mealCount : 0;

    return {
      food,
      mealCount,
      dailyAmount: Math.round(dailyAmount * 100) / 100,
      amountPerMeal: Math.round(amountPerMeal * 100) / 100,
      unit,
    };
  });

  const handleUsePlan = async () => {
    if (saveMode === 'saved_plan' && !planName.trim()) {
      setError('Please enter a name for your plan');
      return;
    }

    if (saveMode === 'apply_to_cat' && !selectedCatId) {
      setError('Please select a cat to apply this plan to');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to use a plan');
        return;
      }

      // Increment the uses_count on the original plan
      await supabase
        .from('saved_meal_plans')
        .update({ uses_count: plan.uses_count + 1 })
        .eq('id', plan.id);

      if (saveMode === 'saved_plan') {
        // Create a new saved plan
        const { data: newPlan, error: insertError } = await supabase
          .from('saved_meal_plans')
          .insert({
            user_id: user.id,
            plan_name: planName.trim(),
            target_der: plan.target_der,
            derived_from_weight_lbs: plan.derived_from_weight_lbs,
            derived_from_age_months: plan.derived_from_age_months,
            meals_per_day: plan.meals_per_day,
            food_selections: plan.food_selections,
            total_kcal: plan.total_kcal,
            total_daily_cost: plan.total_daily_cost,
            total_monthly_cost: plan.total_monthly_cost,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        router.push(`/saved-plans/${newPlan.id}/edit`);
      } else {
        // Apply to selected cat
        const selectedCat = userCats.find(c => c.id === selectedCatId);
        if (!selectedCat) {
          setError('Selected cat not found');
          return;
        }

        // Get the primary food from the plan
        const primaryFood = foodsWithAmounts[0];
        const secondaryFood = foodsWithAmounts[1];

        if (!primaryFood) {
          setError('No foods in this plan');
          return;
        }

        // Calculate amounts based on cat's actual DER
        const catNutrition = calculateNutritionPlan(selectedCat);
        const { kcal: primaryKcal } = getKcalPerUnit(primaryFood.food);

        let primaryDailyAmount: number;
        let secondaryDailyAmount: number | null = null;

        if (secondaryFood) {
          // Split calories between two foods proportionally to original plan
          const totalOriginalMeals = plan.food_selections.reduce((sum, s) => sum + s.mealCount, 0);
          const primaryRatio = primaryFood.mealCount / totalOriginalMeals;
          const primaryCalories = catNutrition.der * primaryRatio;
          const secondaryCalories = catNutrition.der * (1 - primaryRatio);

          primaryDailyAmount = Math.round((primaryCalories / primaryKcal) * 100) / 100;
          const { kcal: secondaryKcal } = getKcalPerUnit(secondaryFood.food);
          secondaryDailyAmount = Math.round((secondaryCalories / secondaryKcal) * 100) / 100;
        } else {
          primaryDailyAmount = Math.round((catNutrition.der / primaryKcal) * 100) / 100;
        }

        // Update the cat's food plan
        const updateData: Record<string, unknown> = {
          selected_food_id: primaryFood.food.id,
          primary_food_amount: primaryDailyAmount,
          meals_per_day: plan.meals_per_day,
          food_plan_selected_at: new Date().toISOString(),
        };

        if (secondaryFood) {
          updateData.secondary_food_id = secondaryFood.food.id;
          updateData.secondary_food_amount = secondaryDailyAmount;
        } else {
          updateData.secondary_food_id = null;
          updateData.secondary_food_amount = null;
        }

        const { error: updateError } = await supabase
          .from('cats')
          .update(updateData)
          .eq('id', selectedCatId);

        if (updateError) throw updateError;

        router.push('/dashboard');
        router.refresh();
      }

      onClose();
    } catch (err) {
      console.error('Error using plan:', err);
      setError('Failed to use plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Use This Plan</h2>
        <p className="text-gray-600 mb-6">
          Choose how you&apos;d like to use this meal plan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Save Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What would you like to do?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSaveMode('saved_plan')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                saveMode === 'saved_plan'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium text-gray-900">Save to My Plans</div>
              <div className="text-xs text-gray-500 mt-1">
                Copy to your saved plans to customize later
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSaveMode('apply_to_cat')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                saveMode === 'apply_to_cat'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🐱</div>
              <div className="font-medium text-gray-900">Apply to a Cat</div>
              <div className="text-xs text-gray-500 mt-1">
                Set as active meal plan for one of your cats
              </div>
            </button>
          </div>
        </div>

        {/* Mode-specific inputs */}
        {saveMode === 'saved_plan' ? (
          <div className="mb-6">
            <Input
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter a name for your plan"
            />
          </div>
        ) : (
          <div className="mb-6">
            {userCats.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                You don&apos;t have any cats yet. Add a cat first to apply this plan.
              </div>
            ) : (
              <Select
                label="Apply to which cat?"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                placeholder="Select a cat..."
                options={userCats.map((cat) => ({
                  value: cat.id,
                  label: `${cat.name} (${cat.weight_lbs} lbs)`,
                }))}
              />
            )}
            {selectedCatId && (
              <p className="mt-2 text-xs text-orange-600">
                This will replace {userCats.find(c => c.id === selectedCatId)?.name}&apos;s current meal plan.
              </p>
            )}
          </div>
        )}

        {/* Original Plan Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          {plan.cat && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-500">Shared by</span>
              <CatAvatar
                catId={plan.cat.id}
                name={plan.cat.name}
                imageUrl={plan.cat.profile_image_url}
                size="sm"
                showName
              />
            </div>
          )}

          <h3 className="font-semibold text-gray-900 mb-2">{plan.plan_name}</h3>

          {/* Food List */}
          <div className="space-y-2 mb-3">
            {foodsWithAmounts.map((item) => (
              <div
                key={item.food.id}
                className="flex items-center gap-3 bg-white rounded-lg p-2"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <SafeImagePreview
                    src={item.food.image_url || ''}
                    alt={item.food.product_name}
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.food.product_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.food.brand}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">
                    {item.amountPerMeal} {item.unit}(s)
                  </div>
                  <div className="text-xs text-gray-500">per meal</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {plan.target_der} kcal/day • {plan.meals_per_day}x daily
            </span>
            {plan.total_monthly_cost && (
              <span className="text-green-600 font-medium">
                ~${plan.total_monthly_cost.toFixed(0)}/mo
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUsePlan}
            isLoading={isSaving}
            disabled={saveMode === 'apply_to_cat' && (!selectedCatId || userCats.length === 0)}
          >
            {saveMode === 'saved_plan' ? 'Copy to My Plans' : 'Apply to Cat'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
