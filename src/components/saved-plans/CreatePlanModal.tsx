'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculateSimpleDER } from '@/lib/nutrition';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    planName: string;
    targetDer: number;
    mealsPerDay: number;
    derivedFromWeight?: number;
    derivedFromAge?: number;
  }) => void;
}

type CalorieInputMode = 'direct' | 'calculated';

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePlanModalProps) {
  // Form state
  const [planName, setPlanName] = useState('');
  const [calorieMode, setCalorieMode] = useState<CalorieInputMode>('direct');
  const [directCalories, setDirectCalories] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPlanName('');
      setCalorieMode('direct');
      setDirectCalories('');
      setWeight('');
      setAge('');
      setMealsPerDay(2);
      setErrors({});
    }
  }, [isOpen]);

  // Calculate DER from weight/age
  const calculatedDer = weight && age
    ? calculateSimpleDER(parseFloat(weight), parseInt(age)).der
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};

    if (!planName.trim()) {
      newErrors.planName = 'Plan name is required';
    }

    let targetDer: number;

    if (calorieMode === 'direct') {
      const calories = parseInt(directCalories);
      if (!directCalories || isNaN(calories) || calories < 50 || calories > 2000) {
        newErrors.calories = 'Enter a valid calorie target (50-2000 kcal)';
      } else {
        targetDer = calories;
      }
    } else {
      const weightVal = parseFloat(weight);
      const ageVal = parseInt(age);

      if (!weight || isNaN(weightVal) || weightVal < 1 || weightVal > 50) {
        newErrors.weight = 'Enter a valid weight (1-50 lbs)';
      }
      if (!age || isNaN(ageVal) || ageVal < 1 || ageVal > 300) {
        newErrors.age = 'Enter a valid age (1-300 months)';
      }

      if (!newErrors.weight && !newErrors.age && calculatedDer) {
        targetDer = calculatedDer;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      planName: planName.trim(),
      targetDer: targetDer!,
      mealsPerDay,
      derivedFromWeight: calorieMode === 'calculated' ? parseFloat(weight) : undefined,
      derivedFromAge: calorieMode === 'calculated' ? parseInt(age) : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Plan</h2>
          <p className="text-sm text-gray-600 mb-6">
            Set up your meal plan parameters to get started.
          </p>

          {/* Plan Name */}
          <div className="mb-6">
            <Input
              label="Plan Name"
              placeholder="e.g., My Cat's Diet, Weight Loss Plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              error={errors.planName}
            />
          </div>

          {/* Calorie Input Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Calories
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setCalorieMode('direct')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  calorieMode === 'direct'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Enter Directly
              </button>
              <button
                type="button"
                onClick={() => setCalorieMode('calculated')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  calorieMode === 'calculated'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calculate from Weight
              </button>
            </div>
          </div>

          {/* Direct Calorie Input */}
          {calorieMode === 'direct' && (
            <div className="mb-6">
              <Input
                type="number"
                placeholder="e.g., 250"
                value={directCalories}
                onChange={(e) => setDirectCalories(e.target.value)}
                error={errors.calories}
                helperText="Enter the target daily calories (kcal)"
              />
            </div>
          )}

          {/* Calculated from Weight/Age */}
          {calorieMode === 'calculated' && (
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Weight (lbs)"
                  placeholder="e.g., 10"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  error={errors.weight}
                  step="0.1"
                />
                <Input
                  type="number"
                  label="Age (months)"
                  placeholder="e.g., 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  error={errors.age}
                />
              </div>

              {/* Calculated DER Preview */}
              {calculatedDer && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        Calculated Daily Energy Requirement
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Based on standard veterinary formulas
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {calculatedDer} kcal
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meals Per Day */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meals Per Day
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMealsPerDay(num)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mealsPerDay === num
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              How many meals will be served each day
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Continue to Build Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
