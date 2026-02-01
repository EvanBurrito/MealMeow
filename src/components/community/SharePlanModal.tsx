'use client';

import { useState } from 'react';
import { SavedMealPlan, Cat, MealPlanCategory, HealthCondition } from '@/types';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SavedMealPlan;
  cats: Cat[];
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

export default function SharePlanModal({
  isOpen,
  onClose,
  plan,
  cats,
  onShared,
}: SharePlanModalProps) {
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MealPlanCategory | ''>('');
  const [selectedHealthFocus, setSelectedHealthFocus] = useState<HealthCondition[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Filter to only show public cats
  const publicCats = cats.filter((cat) => (cat as Cat & { is_public?: boolean }).is_public);

  const handleShare = async () => {
    if (!selectedCatId) {
      setError('Please select a cat to share this plan as');
      return;
    }
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('saved_meal_plans')
        .update({
          is_shared: true,
          cat_id: selectedCatId,
          category: selectedCategory,
          health_focus: selectedHealthFocus,
          shared_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (updateError) throw updateError;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Share to Community
        </h2>
        <p className="text-gray-600 mb-6">
          Share &ldquo;{plan.plan_name}&rdquo; with the MealMeow community. Other cat owners
          will be able to see and use this meal plan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {publicCats.length === 0 ? (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 font-medium mb-2">
              No public cats available
            </p>
            <p className="text-yellow-700 text-sm">
              To share a meal plan, you need at least one cat with a public
              profile. Go to your cat&apos;s profile settings to make them public.
            </p>
          </div>
        ) : (
          <>
            {/* Cat Selection */}
            <div className="mb-4">
              <Select
                label="Share as which cat?"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                placeholder="Select a cat..."
                options={publicCats.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
              />
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as MealPlanCategory)
                }
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
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            isLoading={isSharing}
            disabled={publicCats.length === 0 || !selectedCatId || !selectedCategory}
          >
            Share Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
