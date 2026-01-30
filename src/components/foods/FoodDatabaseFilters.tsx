'use client';

import { FoodType, LifeStage } from '@/types';
import Input from '@/components/ui/Input';

interface FoodDatabaseFiltersProps {
  searchQuery: string;
  foodType: FoodType | 'all';
  lifeStage: LifeStage | 'all';
  onSearchChange: (value: string) => void;
  onFoodTypeChange: (value: FoodType | 'all') => void;
  onLifeStageChange: (value: LifeStage | 'all') => void;
}

export default function FoodDatabaseFilters({
  searchQuery,
  foodType,
  lifeStage,
  onSearchChange,
  onFoodTypeChange,
  onLifeStageChange,
}: FoodDatabaseFiltersProps) {
  const foodTypeOptions: { value: FoodType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'dry', label: 'Dry' },
    { value: 'wet', label: 'Wet' },
  ];

  const lifeStageOptions: { value: LifeStage | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'kitten', label: 'Kitten' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by brand or product name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Food Type Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Type:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {foodTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onFoodTypeChange(option.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  foodType === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Life Stage Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Life Stage:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {lifeStageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onLifeStageChange(option.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  lifeStage === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
