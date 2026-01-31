'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CatFood, Cat } from '@/types';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';

interface SelectFoodPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: CatFood | null;
  cat: Cat;
  dailyAmount: number;
  amountUnit: string;
  dailyCost: number;
  monthlyCost: number;
}

interface ModalData {
  food: CatFood;
  dailyAmount: number;
  amountUnit: string;
  monthlyCost: number;
}

const MEAL_OPTIONS = [
  { value: 2, label: '2 meals', description: 'Morning & Evening' },
  { value: 3, label: '3 meals', description: 'Morning, Noon & Evening' },
  { value: 4, label: '4 meals', description: 'Every 6 hours' },
  { value: 5, label: '5 meals', description: 'Every 4-5 hours' },
  { value: 6, label: '6 meals', description: 'Every 3-4 hours' },
];

export default function SelectFoodPlanModal({
  isOpen,
  onClose,
  food,
  cat,
  dailyAmount,
  amountUnit,
  dailyCost,
  monthlyCost,
}: SelectFoodPlanModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mealsPerDay, setMealsPerDay] = useState(cat.meals_per_day || 2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Store last valid data for fade-out animation
  const lastDataRef = useRef<ModalData | null>(null);

  useEffect(() => {
    if (food) {
      lastDataRef.current = { food, dailyAmount, amountUnit, monthlyCost };
    }
  }, [food, dailyAmount, amountUnit, monthlyCost]);

  // Use current food or last valid food during fade-out
  const displayData = food
    ? { food, dailyAmount, amountUnit, monthlyCost }
    : lastDataRef.current;

  const amountPerMeal = Math.round(((displayData?.dailyAmount ?? dailyAmount) / mealsPerDay) * 100) / 100;

  const handleSelect = async () => {
    if (!food) return;
    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('cats')
        .update({
          selected_food_id: food.id,
          meals_per_day: mealsPerDay,
          food_plan_selected_at: new Date().toISOString(),
        })
        .eq('id', cat.id);

      if (updateError) throw updateError;

      onClose();
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error selecting food plan:', JSON.stringify(err, null, 2));
      const pgError = err as { message?: string; code?: string; details?: string };
      if (pgError?.message) {
        // Check for common column missing errors
        if (pgError.message.includes('column') || pgError.code === '42703') {
          setError('Database columns missing. Please run the food plan migration in Supabase.');
        } else {
          setError(pgError.message);
        }
      } else {
        setError('Failed to save food plan. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {displayData ? (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Select Food Plan</h2>
          <p className="text-gray-600 text-sm mb-6">
            Set this as {cat.name}'s feeding plan
          </p>

          {/* Selected Food */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl mb-6">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
              <SafeImagePreview
                src={displayData.food.image_url || ''}
                alt={displayData.food.product_name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{displayData.food.product_name}</h3>
              <p className="text-gray-600 text-sm">{displayData.food.brand}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-orange-600 font-semibold">${displayData.monthlyCost.toFixed(2)}/mo</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{displayData.dailyAmount} {displayData.amountUnit}(s)/day</span>
              </div>
            </div>
          </div>

        {/* Meals Per Day Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How many meals per day?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMealsPerDay(option.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
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

          {/* Feeding Preview */}
          <div className="p-4 bg-green-50 rounded-xl mb-6">
            <div className="text-sm text-gray-600 mb-1">Each meal</div>
            <div className="text-2xl font-bold text-gray-900">
              {amountPerMeal} {displayData.amountUnit}(s)
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {mealsPerDay}x daily = {displayData.dailyAmount} {displayData.amountUnit}(s) total
            </div>
          </div>

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
            <Button onClick={handleSelect} isLoading={isLoading} className="flex-1">
              Select This Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6" />
      )}
    </Modal>
  );
}
