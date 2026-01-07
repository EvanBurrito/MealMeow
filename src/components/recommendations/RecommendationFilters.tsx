'use client';

import { FOOD_TYPES } from '@/lib/constants';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';

interface RecommendationFiltersProps {
  foodType: string;
  budget: string;
  onFoodTypeChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
}

export default function RecommendationFilters({
  foodType,
  budget,
  onFoodTypeChange,
  onBudgetChange,
}: RecommendationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="w-48">
        <Select
          label="Food Type"
          value={foodType}
          onChange={(e) => onFoodTypeChange(e.target.value)}
          options={FOOD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
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
  );
}
