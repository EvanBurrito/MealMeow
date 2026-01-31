'use client';

import { useState } from 'react';
import { Cat, FoodRecommendation, NutritionPlan, BadgeType } from '@/types';
import { trackFoodClick } from '@/lib/analytics';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface RecommendationCardProps {
  recommendation: FoodRecommendation;
  nutritionPlan: NutritionPlan;
  rank: number;
  cat?: Cat;
  catId?: string;
  userId?: string;
  mealsPerDay?: number;
  onCardClick?: () => void;
  onSelectPlan?: () => void;
}

const badgeConfig: Record<BadgeType, { text: string; color: string; borderColor: string; ringColor: string }> = {
  best_value: { text: 'Best Value', color: 'bg-orange-500', borderColor: 'border-orange-500', ringColor: 'ring-orange-500' },
  best_nutrition: { text: 'Best Nutrition', color: 'bg-green-600', borderColor: 'border-green-600', ringColor: 'ring-green-600' },
  best_match: { text: 'Best Match', color: 'bg-purple-600', borderColor: 'border-purple-600', ringColor: 'ring-purple-600' },
  budget_pick: { text: 'Budget Pick', color: 'bg-blue-500', borderColor: 'border-blue-500', ringColor: 'ring-blue-500' },
};

export default function RecommendationCard({
  recommendation,
  nutritionPlan,
  rank,
  cat,
  catId,
  userId,
  mealsPerDay: mealsPerDayProp,
  onCardClick,
  onSelectPlan,
}: RecommendationCardProps) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const { food, dailyAmount, amountUnit, dailyCost, monthlyCost, score, badges } =
    recommendation;

  // Use provided mealsPerDay or fall back to nutritionPlan
  const mealsPerDay = mealsPerDayProp ?? nutritionPlan.mealsPerDay;
  const amountPerMeal = Math.round((dailyAmount / mealsPerDay) * 100) / 100;

  const primaryBadge = badges.length > 0 ? badges[0] : null;
  const badgeInfo = primaryBadge ? badgeConfig[primaryBadge] : null;
  const hasBadge = !!badgeInfo;

  const handleCardClick = async () => {
    if (userId && catId) {
      await trackFoodClick(userId, catId, food.id, rank, score.overall);
    }
    onCardClick?.();
  };

  return (
    <Card
      variant="default"
      hover={false}
      className={`relative shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] ${hasBadge ? `ring-2 ${badgeInfo?.ringColor}` : 'ring-1 ring-orange-200'} ${onCardClick ? 'cursor-pointer' : ''}`}
      onClick={onCardClick ? handleCardClick : undefined}
    >
      {badgeInfo && (
        <div className={`absolute -top-3 left-4 ${badgeInfo.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
          {badgeInfo.text}
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
          <SafeImagePreview
            src={food.image_url || ''}
            alt={food.product_name}
            fill
            className="object-contain p-1.5"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                {food.product_name}
              </h3>
              <p className="text-gray-600 text-sm">{food.brand}</p>
              {food.flavour && (
                <p className="text-gray-500 text-xs">{food.flavour}</p>
              )}
            </div>
            <span
              className={`px-2 py-1 rounded text-sm font-medium flex-shrink-0 ${
                food.food_type === 'dry'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {food.food_type === 'dry' ? 'Dry' : 'Wet'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Daily Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            {dailyAmount} {amountUnit}(s)
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Per Meal</p>
          <p className="text-lg font-semibold text-gray-900">
            {amountPerMeal} {amountUnit}(s)
          </p>
          <p className="text-xs text-gray-500">
            {mealsPerDay}x daily
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Estimated Cost</p>
          <p className="text-xl font-bold text-orange-600">
            ${monthlyCost.toFixed(2)}/mo
          </p>
          <p className="text-xs text-gray-500">(${dailyCost.toFixed(2)}/day)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Package</p>
          <p className="font-medium text-gray-700">{food.unit_size}</p>
          <p className="text-xs text-gray-500">${food.price_per_unit.toFixed(2)}</p>
        </div>
      </div>

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

      {/* Score Section */}
      <div className="pt-2 mt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowScoreDetails(!showScoreDetails);
          }}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Score</span>
            <div className="flex items-center gap-1">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                style={{ width: `${score.overall}px` }}
              />
              <span className="text-lg font-bold text-orange-600">{score.overall}</span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showScoreDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showScoreDetails && (
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nutrition</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${score.nutritionScore}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">{score.nutritionScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Value</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${score.valueScore}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">{score.valueScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Suitability</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${score.suitabilityScore}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">{score.suitabilityScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Action Buttons - Always visible at bottom */}
      {cat && onSelectPlan && (
        <div className="pt-2 mt-2 border-t border-gray-100">
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan();
            }}
          >
            Select
          </Button>
        </div>
      )}
    </Card>
  );
}
