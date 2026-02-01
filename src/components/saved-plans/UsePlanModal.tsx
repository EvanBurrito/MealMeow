'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Cat, SavedMealPlanWithFoods, CatFood } from '@/types';
import { calculateNutritionPlan, getKcalPerUnit } from '@/lib/nutrition';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface UsePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SavedMealPlanWithFoods;
  onUsed?: () => void;
}

type ModalStep = 'select-cat' | 'confirm';

interface CatWithDer extends Cat {
  der: number;
}

export default function UsePlanModal({
  isOpen,
  onClose,
  plan,
  onUsed,
}: UsePlanModalProps) {
  const [step, setStep] = useState<ModalStep>('select-cat');
  const [cats, setCats] = useState<CatWithDer[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CatWithDer | null>(null);
  const [recalculatePortions, setRecalculatePortions] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select-cat');
      setSelectedCat(null);
      setRecalculatePortions(true);
    }
  }, [isOpen]);

  // Fetch cats when modal opens
  useEffect(() => {
    if (isOpen && cats.length === 0) {
      const fetchCats = async () => {
        setIsLoadingCats(true);
        try {
          const { data } = await supabase
            .from('cats')
            .select('*')
            .order('name');

          if (data) {
            const catsWithDer: CatWithDer[] = data.map((cat) => {
              const nutritionPlan = calculateNutritionPlan(cat);
              return {
                ...cat,
                der: nutritionPlan.der,
              };
            });
            setCats(catsWithDer);
          }
        } catch (err) {
          console.error('Error fetching cats:', err);
        } finally {
          setIsLoadingCats(false);
        }
      };
      fetchCats();
    }
  }, [isOpen, cats.length, supabase]);

  const handleSelectCat = (cat: CatWithDer) => {
    setSelectedCat(cat);
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select-cat');
    setSelectedCat(null);
  };

  const handleApplyPlan = async () => {
    if (!selectedCat) return;

    setIsApplying(true);

    try {
      // Get foods from the plan
      const foodMap = new Map<string, CatFood>();
      plan.foods.forEach((food) => foodMap.set(food.id, food));

      // Calculate amounts
      let primaryFoodId: string | null = null;
      let secondaryFoodId: string | null = null;
      let primaryAmount: number | null = null;
      let secondaryAmount: number | null = null;
      let mealsPerDay = plan.meals_per_day;

      const selections = plan.food_selections;
      const totalMealCount = selections.reduce((sum, s) => sum + s.mealCount, 0);

      if (selections.length >= 1) {
        const firstSelection = selections[0];
        const firstFood = foodMap.get(firstSelection.foodId);

        if (firstFood) {
          primaryFoodId = firstFood.id;

          if (recalculatePortions) {
            // Recalculate based on cat's DER
            const calorieShare = (firstSelection.mealCount / totalMealCount) * selectedCat.der;
            const { kcal } = getKcalPerUnit(firstFood);
            primaryAmount = kcal > 0 ? Math.round((calorieShare / kcal) * 100) / 100 : 0;
          } else {
            // Use original portions from saved plan
            const { kcal } = getKcalPerUnit(firstFood);
            const calorieShare = (firstSelection.mealCount / totalMealCount) * plan.target_der;
            primaryAmount = kcal > 0 ? Math.round((calorieShare / kcal) * 100) / 100 : 0;
          }
        }
      }

      if (selections.length >= 2) {
        const secondSelection = selections[1];
        const secondFood = foodMap.get(secondSelection.foodId);

        if (secondFood) {
          secondaryFoodId = secondFood.id;

          if (recalculatePortions) {
            const calorieShare = (secondSelection.mealCount / totalMealCount) * selectedCat.der;
            const { kcal } = getKcalPerUnit(secondFood);
            secondaryAmount = kcal > 0 ? Math.round((calorieShare / kcal) * 100) / 100 : 0;
          } else {
            const { kcal } = getKcalPerUnit(secondFood);
            const calorieShare = (secondSelection.mealCount / totalMealCount) * plan.target_der;
            secondaryAmount = kcal > 0 ? Math.round((calorieShare / kcal) * 100) / 100 : 0;
          }
        }
      }

      // Update the cat with the plan
      const { error } = await supabase
        .from('cats')
        .update({
          selected_food_id: primaryFoodId,
          secondary_food_id: secondaryFoodId,
          primary_food_amount: primaryAmount,
          secondary_food_amount: secondaryAmount,
          meals_per_day: mealsPerDay,
          food_plan_selected_at: new Date().toISOString(),
        })
        .eq('id', selectedCat.id);

      if (error) throw error;

      onUsed?.();
      onClose();
      router.refresh();
    } catch (err) {
      console.error('Error applying plan:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {step === 'select-cat' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Use &quot;{plan.plan_name}&quot;
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Select which cat to apply this meal plan to
            </p>

            {isLoadingCats ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : cats.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-3 block">🐱</span>
                <p className="text-gray-600 mb-4">You haven&apos;t added any cats yet</p>
                <Button
                  onClick={() => {
                    onClose();
                    router.push('/cats/new');
                  }}
                >
                  Add Your First Cat
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCat(cat)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    {/* Cat Image */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-orange-50 border-2 border-orange-200 flex-shrink-0">
                      {cat.profile_image_url ? (
                        <Image
                          src={cat.profile_image_url}
                          alt={cat.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🐱
                        </div>
                      )}
                    </div>

                    {/* Cat Info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 truncate block">
                        {cat.name}
                      </span>
                      <p className="text-sm text-gray-500">
                        {cat.der} kcal/day needed
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'confirm' && selectedCat && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Apply to {selectedCat.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Confirm how to apply the meal plan
                </p>
              </div>
            </div>

            {/* Plan Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">{plan.plan_name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Target: {plan.target_der} kcal/day</span>
                <span>{plan.meals_per_day} meals/day</span>
              </div>
            </div>

            {/* Cat Info */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl mb-6">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-orange-200 flex-shrink-0">
                {selectedCat.profile_image_url ? (
                  <Image
                    src={selectedCat.profile_image_url}
                    alt={selectedCat.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    🐱
                  </div>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-900">{selectedCat.name}</span>
                <p className="text-sm text-gray-600">
                  Needs {selectedCat.der} kcal/day
                </p>
              </div>
            </div>

            {/* Recalculation Option */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="recalculate"
                  checked={recalculatePortions}
                  onChange={() => setRecalculatePortions(true)}
                  className="mt-1 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">
                    Recalculate portions for {selectedCat.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    Adjust amounts to meet {selectedCat.der} kcal/day (Recommended)
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="recalculate"
                  checked={!recalculatePortions}
                  onChange={() => setRecalculatePortions(false)}
                  className="mt-1 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">
                    Keep original portions
                  </span>
                  <span className="text-sm text-gray-500">
                    Use the saved plan&apos;s amounts ({plan.target_der} kcal/day)
                  </span>
                </div>
              </label>
            </div>

            {/* Warning if calories differ significantly */}
            {Math.abs(selectedCat.der - plan.target_der) > 50 && !recalculatePortions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-800">
                    The saved plan ({plan.target_der} kcal) differs from {selectedCat.name}&apos;s needs ({selectedCat.der} kcal).
                    Consider recalculating portions.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {step === 'confirm' && (
          <Button onClick={handleApplyPlan} isLoading={isApplying}>
            Apply Plan
          </Button>
        )}
      </div>
    </Modal>
  );
}
