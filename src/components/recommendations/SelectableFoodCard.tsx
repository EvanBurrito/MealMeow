'use client';

import { CatFood, BadgeType } from '@/types';
import { getKcalPerUnit } from '@/lib/nutrition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import HighlightedText from '@/components/ui/HighlightedText';

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface SelectableFoodCardProps {
  food: CatFood;
  isSelected: boolean;
  portion?: {
    dailyAmount: number;
    unit: string;
    kcal: number;
  };
  mealsPerDay?: number;
  monthlyCost?: number;
  dailyCost?: number;
  badge?: BadgeType;
  searchQuery?: string;
  isRecommendedPair?: boolean;
  isMaxSelected?: boolean;
  mealCount?: number;
  onAdd: () => void;
  onDecrement?: () => void;
  onCardClick?: () => void;
}

const badgeConfig: Record<BadgeType, { text: string; color: string; ringColor: string }> = {
  best_value: { text: 'Best Value', color: 'bg-orange-500', ringColor: 'ring-orange-500' },
  best_nutrition: { text: 'Best Nutrition', color: 'bg-green-600', ringColor: 'ring-green-600' },
  best_match: { text: 'Best Match', color: 'bg-purple-600', ringColor: 'ring-purple-600' },
  budget_pick: { text: 'Budget Pick', color: 'bg-blue-500', ringColor: 'ring-blue-500' },
};

export default function SelectableFoodCard({
  food,
  isSelected,
  portion,
  mealsPerDay = 2,
  monthlyCost,
  dailyCost,
  badge,
  searchQuery,
  isRecommendedPair,
  isMaxSelected,
  mealCount = 0,
  onAdd,
  onDecrement,
  onCardClick,
}: SelectableFoodCardProps) {
  const badgeInfo = badge ? badgeConfig[badge] : null;
  const hasBadge = !!badgeInfo;

  const amountPerMeal = portion ? Math.round((portion.dailyAmount / mealsPerDay) * 100) / 100 : 0;

  return (
    <Card
      variant="default"
      hover={false}
      className={`relative cursor-pointer transition-all duration-150 active:scale-[0.98] ${
        isSelected
          ? 'ring-2 ring-emerald-500 shadow-md bg-emerald-50/30'
          : isRecommendedPair && !isMaxSelected
            ? 'ring-0 animate-glow-purple'
            : hasBadge && !isMaxSelected
              ? `ring-2 ${badgeInfo?.ringColor}`
              : 'ring-1 ring-orange-200 hover:shadow-md'
      }`}
      onClick={onCardClick || onAdd}
    >
      {/* Badge - always show for selected, fade out only for non-selected when max selected */}
      {badgeInfo && (isSelected || !isMaxSelected) && (
        <div className={`absolute -top-3 left-4 ${badgeInfo.color} text-white px-3 py-1 rounded-full text-sm font-medium transition-opacity duration-300`}>
          {badgeInfo.text}
        </div>
      )}

      {/* Recommended pair indicator - multiple sparkle icons */}
      {isRecommendedPair && !isSelected && !isMaxSelected && (
        <>
          <div className="absolute top-3 left-3 text-purple-400 animate-bounce-subtle z-10" style={{ animationDelay: '0ms' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
            </svg>
          </div>
          <div className="absolute top-3 right-12 text-purple-500 animate-bounce-subtle z-10" style={{ animationDelay: '200ms' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
            </svg>
          </div>
          <div className="absolute bottom-3 right-3 text-purple-300 animate-bounce-subtle z-10" style={{ animationDelay: '400ms' }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
            </svg>
          </div>
        </>
      )}

      {/* Best Pair badge - also respect isMaxSelected */}
      {isRecommendedPair && !isSelected && !isMaxSelected && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg z-20 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />
          </svg>
          Best Pair
        </div>
      )}

      {/* Selection indicator with meal count */}
      {isSelected && mealCount > 0 ? (
        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          × {mealCount}
        </div>
      ) : (
        <div
          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
            isSelected
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-gray-300 bg-white'
          }`}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      )}

      {/* Header with image and basic info */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
          <SafeImagePreview
            src={food.image_url || ''}
            alt={food.product_name}
            fill
            className="object-contain p-1.5"
          />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                <HighlightedText text={food.product_name} highlight={searchQuery || ''} />
              </h3>
              <p className="text-gray-600 text-sm">
                <HighlightedText text={food.brand} highlight={searchQuery || ''} />
              </p>
              {food.flavour && (
                <p className="text-gray-500 text-xs">
                  <HighlightedText text={food.flavour} highlight={searchQuery || ''} />
                </p>
              )}
            </div>
          </div>
          <span
            className={`mt-1 inline-block px-2 py-1 rounded text-sm font-medium ${
              food.food_type === 'dry'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {food.food_type === 'dry' ? 'Dry' : 'Wet'}
          </span>
        </div>
      </div>

      {/* Daily Amount & Per Meal - matches RecommendationCard */}
      {portion && (
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Daily Amount</p>
            <p className="text-lg font-semibold text-gray-900">
              {portion.dailyAmount} {portion.unit}(s)
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Per Meal</p>
            <p className="text-lg font-semibold text-gray-900">
              {amountPerMeal} {portion.unit}(s)
            </p>
            <p className="text-xs text-gray-500">
              {mealsPerDay}x daily
            </p>
          </div>
        </div>
      )}

      {/* Cost & Package - matches RecommendationCard */}
      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Estimated Cost</p>
          {monthlyCost !== undefined ? (
            <>
              <p className="text-xl font-bold text-orange-600">
                ${monthlyCost.toFixed(2)}/mo
              </p>
              {dailyCost !== undefined && (
                <p className="text-xs text-gray-500">(${dailyCost.toFixed(2)}/day)</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Select to calculate</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Package</p>
          <p className="font-medium text-gray-700">{food.unit_size}</p>
          <p className="text-xs text-gray-500">${food.price_per_unit.toFixed(2)}</p>
        </div>
      </div>

      {/* Nutrition - matches RecommendationCard */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-1">Nutrition</p>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">Protein: </span>
            <span className="font-medium">{food.protein_pct}%</span>
          </div>
          <div>
            <span className="text-gray-500">Fat: </span>
            <span className="font-medium">{food.fat_pct}%</span>
          </div>
          <div>
            <span className="text-gray-500">Fiber: </span>
            <span className="font-medium">{food.fiber_pct}%</span>
          </div>
        </div>
      </div>

      {/* Special benefits - matches RecommendationCard (show all) */}
      {food.special_benefits && food.special_benefits.length > 0 && (
        <div className="pt-2 mt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {food.special_benefits.map((benefit) => (
              <span
                key={benefit}
                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
              >
                {toTitleCase(benefit)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="pt-2 mt-2 border-t border-gray-100">
        {isSelected ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              disabled={isMaxSelected}
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 ${mealCount <= 1 ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              onClick={(e) => {
                e.stopPropagation();
                onDecrement?.();
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
Remove
              </span>
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={isMaxSelected}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to meal plan
            </span>
          </Button>
        )}
      </div>

      {/* Selection info footer */}
      {isSelected && portion && (
        <div className="mt-3 pt-3 border-t border-emerald-200 bg-emerald-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700 font-medium">
              {mealCount > 0 ? `× ${mealCount} meal${mealCount > 1 ? 's' : ''}` : 'Selected'}: {portion.kcal} kcal/day
            </span>
            <span className="text-emerald-600">
              {portion.dailyAmount} {portion.unit}(s)/day
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
