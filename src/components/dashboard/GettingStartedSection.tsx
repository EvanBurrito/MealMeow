'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface GettingStartedSectionProps {
  hasCats: boolean;
  hasFoodPlan: boolean;
}

const STEPS = [
  {
    number: 1,
    title: 'Add Your Cat',
    description: 'Create a profile with weight, age, and health needs',
    icon: '🐱',
    href: '/cats/new',
    action: 'Add Cat',
  },
  {
    number: 2,
    title: 'Get Recommendations',
    description: 'View personalized food options based on your cat\'s needs',
    icon: '🔍',
    href: null, // Dynamic based on cat
    action: 'Browse Foods',
  },
  {
    number: 3,
    title: 'Select a Food Plan',
    description: 'Choose the best food and set your feeding schedule',
    icon: '📋',
    href: null,
    action: 'Select Plan',
  },
  {
    number: 4,
    title: 'Follow the Plan',
    description: 'Get daily feeding amounts and helpful tips',
    icon: '✅',
    href: null,
    action: 'View Plan',
  },
];

export default function GettingStartedSection({ hasCats, hasFoodPlan }: GettingStartedSectionProps) {
  // Determine current step
  let currentStep = 1;
  if (hasCats) currentStep = 2;
  if (hasFoodPlan) currentStep = 4;

  return (
    <Card variant="elevated" className="mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 -m-5 mb-5 p-5">
        <h2 className="text-xl font-bold text-white">Welcome to MealMeow!</h2>
        <p className="text-orange-100 text-sm mt-1">
          Get personalized food recommendations for your cat
        </p>
      </div>

      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLocked = step.number > currentStep;

          return (
            <div
              key={step.number}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-orange-50 border-2 border-orange-200'
                  : isCompleted
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-gray-50 border border-gray-100 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  {isCompleted && (
                    <span className="text-xs text-green-600 font-medium">Done!</span>
                  )}
                </div>
                <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </div>
              {isCurrent && step.href && (
                <Link href={step.href}>
                  <Button size="sm">{step.action}</Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-gray-900">Why use MealMeow?</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Personalized calorie calculations based on your cat's needs</li>
              <li>• Compare foods by nutrition, cost, and health benefits</li>
              <li>• Get exact daily feeding amounts</li>
              <li>• Track monthly food costs</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
