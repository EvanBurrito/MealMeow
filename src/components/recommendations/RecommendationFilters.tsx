'use client';

import { HealthCondition } from '@/types';
import { HEALTH_CONDITIONS } from '@/lib/constants';
import Input from '@/components/ui/Input';

interface RecommendationFiltersProps {
  foodType: string;
  budget: string;
  healthConditions: HealthCondition[];
  onFoodTypeChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onHealthConditionsChange: (conditions: HealthCondition[]) => void;
}

const FOOD_TYPE_OPTIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'wet', label: 'Wet' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function RecommendationFilters({
  foodType,
  budget,
  healthConditions,
  onFoodTypeChange,
  onBudgetChange,
  onHealthConditionsChange,
}: RecommendationFiltersProps) {
  const handleToggleCondition = (condition: HealthCondition) => {
    if (healthConditions.includes(condition)) {
      onHealthConditionsChange(healthConditions.filter((c) => c !== condition));
    } else {
      onHealthConditionsChange([...healthConditions, condition]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Food Type
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {FOOD_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onFoodTypeChange(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  foodType === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${option.value !== 'dry' ? 'border-l border-gray-300' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="w-48">
          <Input
            type="number"
            label="Max Budget ($/month)"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            placeholder="No limit"
            min="0"
            step="10"
          />
        </div>
      </div>
      {healthConditions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Filters
            <span className="text-gray-400 font-normal ml-1">(from cat profile)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {HEALTH_CONDITIONS.filter((c) =>
              healthConditions.includes(c.value as HealthCondition)
            ).map((condition) => (
              <button
                key={condition.value}
                type="button"
                onClick={() => handleToggleCondition(condition.value as HealthCondition)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
              >
                {condition.label}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Click to temporarily remove a health filter
          </p>
        </div>
      )}
    </div>
  );
}
