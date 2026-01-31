'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SavedMealPlanWithFoods } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SavedPlanCard from './SavedPlanCard';
import CreatePlanModal from '@/components/saved-plans/CreatePlanModal';

interface SavedPlansSectionProps {
  plans: SavedMealPlanWithFoods[];
}

export default function SavedPlansSection({ plans: initialPlans }: SavedPlansSectionProps) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handlePlanDeleted = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    router.refresh();
  };

  const handleCreatePlan = (data: {
    planName: string;
    targetDer: number;
    mealsPerDay: number;
    derivedFromWeight?: number;
    derivedFromAge?: number;
  }) => {
    // Navigate to the build plan page with the setup data
    const params = new URLSearchParams({
      name: data.planName,
      der: data.targetDer.toString(),
      meals: data.mealsPerDay.toString(),
    });

    if (data.derivedFromWeight) {
      params.set('weight', data.derivedFromWeight.toString());
    }
    if (data.derivedFromAge) {
      params.set('age', data.derivedFromAge.toString());
    }

    setShowCreateModal(false);
    router.push(`/saved-plans/new?${params.toString()}`);
  };

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Plans</h2>
          <p className="text-gray-600 text-sm mt-1">
            {plans.length === 0
              ? 'Create meal plans without a cat profile'
              : `${plans.length} saved plan${plans.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create New Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card variant="bordered" hover={false} className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No saved plans yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create a meal plan to experiment with different food combinations
            without needing a full cat profile.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Plan
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map(plan => (
            <SavedPlanCard
              key={plan.id}
              plan={plan}
              onDeleted={() => handlePlanDeleted(plan.id)}
            />
          ))}
        </div>
      )}

      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlan}
      />
    </div>
  );
}
