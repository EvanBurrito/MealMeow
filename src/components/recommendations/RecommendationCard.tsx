import { FoodRecommendation, NutritionPlan } from '@/types';
import Card from '@/components/ui/Card';

interface RecommendationCardProps {
  recommendation: FoodRecommendation;
  nutritionPlan: NutritionPlan;
  rank: number;
}

export default function RecommendationCard({
  recommendation,
  nutritionPlan,
  rank,
}: RecommendationCardProps) {
  const { food, dailyAmount, amountUnit, amountPerMeal, dailyCost, monthlyCost } =
    recommendation;

  const isTopPick = rank === 1;

  return (
    <Card
      variant="bordered"
      className={`relative ${isTopPick ? 'border-orange-500 border-2' : ''}`}
    >
      {isTopPick && (
        <div className="absolute -top-3 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          Best Value
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {food.product_name}
          </h3>
          <p className="text-gray-600">{food.brand}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            food.food_type === 'dry'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {food.food_type === 'dry' ? 'Dry' : 'Wet'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
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
            {nutritionPlan.mealsPerDay}x daily
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-gray-100">
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

      <div className="pt-3 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-2">Nutrition</p>
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

      {food.special_benefits && food.special_benefits.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {food.special_benefits.map((benefit) => (
              <span
                key={benefit}
                className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
