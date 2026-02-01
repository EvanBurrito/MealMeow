'use client';

import { useState } from 'react';
import { Cat, CatFood, MealPlanCategory, HealthCondition } from '@/types';
import { getKcalPerUnit, calculateNutritionPlan } from '@/lib/nutrition';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface ShareActivePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  cat: Cat;
  food: CatFood;
  secondaryFood?: CatFood | null;
  onShared?: () => void;
}

const categories: { value: MealPlanCategory; label: string }[] = [
  { value: 'indoor', label: 'Indoor Cat' },
  { value: 'outdoor', label: 'Active/Outdoor' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'senior', label: 'Senior Cat (12+ years)' },
  { value: 'kitten', label: 'Kitten (under 1 year)' },
  { value: 'health', label: 'Health Focus' },
];

const healthConditions: { value: HealthCondition; label: string }[] = [
  { value: 'weight_management', label: 'Weight Management' },
  { value: 'sensitive_stomach', label: 'Sensitive Stomach' },
  { value: 'urinary_health', label: 'Urinary Health' },
  { value: 'hairball_control', label: 'Hairball Control' },
  { value: 'dental_health', label: 'Dental Health' },
  { value: 'skin_coat', label: 'Skin & Coat' },
  { value: 'joint_support', label: 'Joint Support' },
  { value: 'kidney_support', label: 'Kidney Support' },
  { value: 'diabetic', label: 'Diabetic' },
];

export default function ShareActivePlanModal({
  isOpen,
  onClose,
  cat,
  food,
  secondaryFood,
  onShared,
}: ShareActivePlanModalProps) {
  const [planName, setPlanName] = useState(`${cat.name}'s ${food.product_name} Plan`);
  const [selectedCategory, setSelectedCategory] = useState<MealPlanCategory | ''>('');
  const [selectedHealthFocus, setSelectedHealthFocus] = useState<HealthCondition[]>(
    cat.health_conditions || []
  );
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const nutritionPlan = calculateNutritionPlan(cat);
  const mealsPerDay = cat.meals_per_day || 2;
  const isCombo = !!secondaryFood && !!cat.secondary_food_id;

  // Calculate food selections
  const { kcal: primaryKcal } = getKcalPerUnit(food);
  const primaryDailyAmount = cat.primary_food_amount ?? Math.round((nutritionPlan.der / primaryKcal) * 100) / 100;

  let secondaryDailyAmount = 0;
  let secondaryKcal = 0;
  if (isCombo && secondaryFood) {
    const secFoodInfo = getKcalPerUnit(secondaryFood);
    secondaryKcal = secFoodInfo.kcal;
    secondaryDailyAmount = cat.secondary_food_amount ?? 0;
  }

  const primaryKcalTotal = primaryDailyAmount * primaryKcal;
  const secondaryKcalTotal = secondaryDailyAmount * secondaryKcal;
  const totalKcal = Math.round(primaryKcalTotal + secondaryKcalTotal);

  const handleShare = async () => {
    if (!planName.trim()) {
      setError('Please enter a name for the plan');
      return;
    }
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to share a plan');
        return;
      }

      // Build food selections for the saved plan
      const foodSelections = [
        { foodId: food.id, mealCount: mealsPerDay }
      ];

      if (isCombo && secondaryFood) {
        // For combo, split meals between foods
        foodSelections[0].mealCount = Math.ceil(mealsPerDay / 2);
        foodSelections.push({
          foodId: secondaryFood.id,
          mealCount: Math.floor(mealsPerDay / 2),
        });
      }

      // Create the shared plan
      const { error: insertError } = await supabase
        .from('saved_meal_plans')
        .insert({
          user_id: user.id,
          plan_name: planName.trim(),
          target_der: nutritionPlan.der,
          derived_from_weight_lbs: cat.weight_lbs,
          derived_from_age_months: cat.age_months,
          meals_per_day: mealsPerDay,
          food_selections: foodSelections,
          total_kcal: totalKcal,
          // Sharing fields
          is_shared: true,
          cat_id: cat.id,
          category: selectedCategory,
          health_focus: selectedHealthFocus,
          shared_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      onShared?.();
      onClose();
    } catch (err) {
      console.error('Error sharing plan:', err);
      setError('Failed to share plan. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const toggleHealthFocus = (condition: HealthCondition) => {
    setSelectedHealthFocus((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  // Auto-detect category based on cat profile
  const suggestedCategory = (): MealPlanCategory | '' => {
    if (cat.age_months < 12) return 'kitten';
    if (cat.age_months >= 144) return 'senior';
    if (cat.goal === 'lose') return 'weight_loss';
    if (cat.goal === 'gain') return 'weight_gain';
    if (cat.activity_level === 'inactive') return 'indoor';
    if (cat.activity_level === 'active') return 'outdoor';
    if (cat.health_conditions && cat.health_conditions.length > 0) return 'health';
    return '';
  };

  // Set suggested category on first render if not set
  if (!selectedCategory && suggestedCategory()) {
    setSelectedCategory(suggestedCategory());
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Share to Community
        </h2>
        <p className="text-gray-600 mb-6">
          Share {cat.name}&apos;s meal plan with the MealMeow community. Other cat owners
          will be able to see and use this plan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Plan Name */}
        <div className="mb-4">
          <Input
            label="Plan Name"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Enter a name for this plan"
          />
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as MealPlanCategory)}
            placeholder="Select a category..."
            options={categories.map((cat) => ({
              value: cat.value,
              label: cat.label,
            }))}
          />
        </div>

        {/* Health Focus Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Focus (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {healthConditions.map((condition) => (
              <button
                key={condition.value}
                type="button"
                onClick={() => toggleHealthFocus(condition.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedHealthFocus.includes(condition.value)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {condition.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Preview */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">Plan includes:</p>
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{food.brand} {food.product_name}</p>
            {isCombo && secondaryFood && (
              <p className="font-medium text-gray-900">+ {secondaryFood.brand} {secondaryFood.product_name}</p>
            )}
            <p className="text-gray-600">
              {nutritionPlan.der} kcal/day target • {mealsPerDay}x daily
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            isLoading={isSharing}
            disabled={!selectedCategory}
          >
            Share Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
