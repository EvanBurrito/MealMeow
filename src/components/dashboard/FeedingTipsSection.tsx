'use client';

import { useState } from 'react';
import { Cat, CatFood } from '@/types';
import Card from '@/components/ui/Card';

interface FeedingTipsSectionProps {
  cat: Cat;
  food: CatFood;
}

interface Tip {
  id: string;
  icon: string;
  title: string;
  content: string;
  category: 'feeding' | 'transition' | 'health' | 'storage';
}

const GENERAL_TIPS: Tip[] = [
  {
    id: 'schedule',
    icon: '⏰',
    title: 'Stick to a Schedule',
    content: 'Feed your cat at the same times each day. Cats thrive on routine and a consistent schedule helps with digestion and prevents overeating.',
    category: 'feeding',
  },
  {
    id: 'measure',
    icon: '📏',
    title: 'Measure Portions',
    content: 'Use a measuring cup or kitchen scale to ensure accurate portions. Even small overfeeding adds up over time.',
    category: 'feeding',
  },
  {
    id: 'water',
    icon: '💧',
    title: 'Fresh Water Always',
    content: 'Ensure clean, fresh water is available at all times. Consider a water fountain - many cats prefer running water.',
    category: 'health',
  },
  {
    id: 'transition',
    icon: '🔄',
    title: 'Gradual Transition',
    content: 'When switching foods, mix old and new food over 7-10 days. Start with 25% new food and gradually increase.',
    category: 'transition',
  },
  {
    id: 'storage',
    icon: '📦',
    title: 'Proper Storage',
    content: 'Store dry food in an airtight container in a cool, dry place. Refrigerate opened wet food and use within 3 days.',
    category: 'storage',
  },
  {
    id: 'treats',
    icon: '🍬',
    title: 'Treat Budget',
    content: 'Treats should be less than 10% of daily calories. Too many treats can unbalance nutrition and lead to weight gain.',
    category: 'feeding',
  },
];

const DRY_FOOD_TIPS: Tip[] = [
  {
    id: 'dry-hydration',
    icon: '💧',
    title: 'Extra Hydration',
    content: 'Cats on dry food diets need extra water. Consider adding a water fountain or wet food occasionally for hydration.',
    category: 'health',
  },
  {
    id: 'dry-dental',
    icon: '🦷',
    title: 'Dental Benefits',
    content: 'Dry kibble can help reduce tartar buildup, but it\'s not a substitute for dental care. Regular vet checkups are still important.',
    category: 'health',
  },
];

const WET_FOOD_TIPS: Tip[] = [
  {
    id: 'wet-freshness',
    icon: '🕐',
    title: 'Don\'t Leave Out',
    content: 'Wet food spoils quickly. Remove uneaten food after 30-45 minutes to prevent bacterial growth.',
    category: 'feeding',
  },
  {
    id: 'wet-temp',
    icon: '🌡️',
    title: 'Room Temperature',
    content: 'Serve wet food at room temperature. Cold food from the fridge can upset some cats\' stomachs.',
    category: 'feeding',
  },
];

export default function FeedingTipsSection({ cat, food }: FeedingTipsSectionProps) {
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  // Combine tips based on food type
  const tips = [
    ...GENERAL_TIPS,
    ...(food.food_type === 'dry' ? DRY_FOOD_TIPS : WET_FOOD_TIPS),
  ];

  // Personalized tips based on cat's profile
  const personalizedTips: Tip[] = [];

  if (cat.goal === 'lose') {
    personalizedTips.push({
      id: 'weight-loss',
      icon: '⚖️',
      title: 'Weight Management',
      content: `Since ${cat.name} is on a weight loss plan, avoid giving extra treats or table scraps. Stick strictly to the measured portions.`,
      category: 'health',
    });
  }

  if (cat.health_conditions.includes('sensitive_stomach')) {
    personalizedTips.push({
      id: 'sensitive',
      icon: '🤢',
      title: 'Sensitive Stomach Care',
      content: 'For cats with sensitive stomachs, smaller, more frequent meals may help. Avoid sudden food changes.',
      category: 'health',
    });
  }

  if (cat.age_months < 12) {
    personalizedTips.push({
      id: 'kitten',
      icon: '🍼',
      title: 'Kitten Feeding',
      content: 'Kittens have smaller stomachs but higher energy needs. Feed smaller portions more frequently throughout the day.',
      category: 'feeding',
    });
  }

  if (cat.age_months > 120) {
    personalizedTips.push({
      id: 'senior',
      icon: '👴',
      title: 'Senior Cat Care',
      content: 'Older cats may need softer food or smaller kibble. Monitor water intake and watch for any changes in appetite.',
      category: 'health',
    });
  }

  const allTips = [...personalizedTips, ...tips];

  return (
    <Card variant="bordered" className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="text-lg font-semibold text-gray-900">Feeding Tips for {cat.name}</h3>
      </div>

      {personalizedTips.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-xl">
          <p className="text-sm text-orange-800 font-medium">
            Personalized tips based on {cat.name}'s profile
          </p>
        </div>
      )}

      <div className="space-y-2">
        {allTips.slice(0, 6).map((tip) => (
          <button
            key={tip.id}
            onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
            className="w-full text-left"
          >
            <div
              className={`p-3 rounded-xl transition-all ${
                expandedTip === tip.id
                  ? 'bg-gray-100'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{tip.icon}</span>
                <span className="font-medium text-gray-900 flex-1">{tip.title}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    expandedTip === tip.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandedTip === tip.id && (
                <p className="mt-2 text-sm text-gray-600 pl-9">
                  {tip.content}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Always consult your veterinarian for specific dietary advice
        </p>
      </div>
    </Card>
  );
}
