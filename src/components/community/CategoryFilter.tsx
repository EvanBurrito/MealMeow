'use client';

import { MealPlanCategory } from '@/types';

interface CategoryFilterProps {
  selected: MealPlanCategory | 'all';
  onChange: (category: MealPlanCategory | 'all') => void;
}

const categories: { value: MealPlanCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Plans', icon: '🐱' },
  { value: 'indoor', label: 'Indoor', icon: '🏠' },
  { value: 'outdoor', label: 'Active/Outdoor', icon: '🏃' },
  { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
  { value: 'weight_gain', label: 'Weight Gain', icon: '💪' },
  { value: 'senior', label: 'Senior', icon: '🧓' },
  { value: 'kitten', label: 'Kitten', icon: '🍼' },
  { value: 'health', label: 'Health Focus', icon: '❤️' },
];

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onChange(category.value)}
          className={`
            inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${
              selected === category.value
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            }
          `}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
}
