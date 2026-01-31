'use client';

import { MealPlanOption } from '@/types';
import SafeImagePreview from '@/components/ui/SafeImagePreview';

interface MealPlanOptionCardProps {
  option: MealPlanOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MealPlanOptionCard({
  option,
  isSelected,
  onSelect,
}: MealPlanOptionCardProps) {
  const { primary, complement, totalKcal, difference, percentDifference, dailyCost, monthlyCost, suitabilityNote, type } = option;

  const getDifferenceColor = () => {
    const absDiff = Math.abs(percentDifference);
    if (absDiff <= 5) return 'text-green-600 bg-green-50';
    if (absDiff <= 10) return 'text-yellow-600 bg-yellow-50';
    if (percentDifference > 0) return 'text-orange-600 bg-orange-50';
    return 'text-red-500 bg-red-50';
  };

  const formatDifference = () => {
    if (Math.abs(difference) < 5) return 'On target';
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference} kcal`;
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      {/* Header with badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === 'combo' && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              Combo
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifferenceColor()}`}>
            {formatDifference()}
          </span>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Food amounts */}
      <div className="space-y-2 mb-3">
        {/* Primary food */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
            <SafeImagePreview
              src={primary.food.image_url || ''}
              alt={primary.food.product_name}
              fill
              className="object-contain p-0.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{primary.food.product_name}</p>
            <p className="text-sm text-orange-600 font-semibold">
              {primary.dailyAmount} {primary.unit}(s)/day
            </p>
          </div>
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
            primary.food.food_type === 'dry' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {primary.food.food_type === 'dry' ? 'Dry' : 'Wet'}
          </span>
        </div>

        {/* Complement food (for combo) */}
        {complement && (
          <>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs">+</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                <SafeImagePreview
                  src={complement.food.image_url || ''}
                  alt={complement.food.product_name}
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{complement.food.product_name}</p>
                <p className="text-sm text-orange-600 font-semibold">
                  {complement.dailyAmount} {complement.unit}(s)/day
                </p>
              </div>
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                complement.food.food_type === 'dry' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {complement.food.food_type === 'dry' ? 'Dry' : 'Wet'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">{suitabilityNote}</p>
          <p className="text-xs text-gray-400">{totalKcal} kcal/day</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">${monthlyCost.toFixed(2)}/mo</p>
          <p className="text-xs text-gray-500">${dailyCost.toFixed(2)}/day</p>
        </div>
      </div>
    </button>
  );
}
