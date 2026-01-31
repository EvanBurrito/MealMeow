'use client';

import { CatFood } from '@/types';
import Card from '@/components/ui/Card';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import HighlightedText from '@/components/ui/HighlightedText';

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface FoodCardProps {
  food: CatFood;
  onClick?: () => void;
  searchQuery?: string;
}

export default function FoodCard({ food, onClick, searchQuery = '' }: FoodCardProps) {
  return (
    <Card
      variant="default"
      hover={false}
      className="relative shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] ring-1 ring-gray-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
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
                <HighlightedText text={food.product_name} highlight={searchQuery} />
              </h3>
              <p className="text-gray-600 text-sm">
                <HighlightedText text={food.brand} highlight={searchQuery} />
              </p>
              {food.flavour && (
                <p className="text-gray-500 text-xs">
                  <HighlightedText text={food.flavour} highlight={searchQuery} />
                </p>
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

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Price</p>
          <p className="text-lg font-bold text-orange-600">
            ${food.price_per_unit.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Package</p>
          <p className="font-medium text-gray-700">{food.unit_size}</p>
        </div>
      </div>

      {food.special_benefits && food.special_benefits.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {food.special_benefits.slice(0, 3).map((benefit) => (
              <span
                key={benefit}
                className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
              >
                {toTitleCase(benefit)}
              </span>
            ))}
            {food.special_benefits.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                +{food.special_benefits.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
