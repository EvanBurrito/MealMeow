import Image from 'next/image';
import { NutritionPlan, Cat } from '@/types';
import { formatAge } from '@/lib/nutrition';
import Card from '@/components/ui/Card';

interface NutritionSummaryProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
}

export default function NutritionSummary({
  cat,
  nutritionPlan,
}: NutritionSummaryProps) {
  return (
    <Card variant="elevated" className="bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-orange-200 bg-white flex-shrink-0">
          {cat.profile_image_url ? (
            <Image
              src={cat.profile_image_url}
              alt={cat.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🐱
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{cat.name}&apos;s Nutrition Plan</h2>
          <p className="text-gray-600">
            {formatAge(cat.age_months)} • {cat.weight_lbs} lbs • {cat.breed}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{nutritionPlan.der}</p>
          <p className="text-sm text-gray-600">kcal/day</p>
          <p className="text-xs text-gray-500 mt-1">Daily Energy Need</p>
        </div>

        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {nutritionPlan.mealsPerDay}
          </p>
          <p className="text-sm text-gray-600">meals/day</p>
          <p className="text-xs text-gray-500 mt-1">Recommended</p>
        </div>

        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {nutritionPlan.treatBudget}
          </p>
          <p className="text-sm text-gray-600">kcal treats</p>
          <p className="text-xs text-gray-500 mt-1">Max 10% of diet</p>
        </div>

        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{nutritionPlan.factor}x</p>
          <p className="text-sm text-gray-600">factor</p>
          <p className="text-xs text-gray-500 mt-1">{nutritionPlan.factorName}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white/50 rounded-lg text-sm text-gray-600">
        <strong>Note:</strong> These calculations are starting points. Monitor your cat&apos;s
        weight and body condition, and adjust portions accordingly. Consult your
        veterinarian for personalized advice.
      </div>
    </Card>
  );
}
