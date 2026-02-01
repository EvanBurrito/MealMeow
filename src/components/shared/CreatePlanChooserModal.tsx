'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Cat } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CreatePlanModal from '@/components/saved-plans/CreatePlanModal';

interface CreatePlanChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'choose' | 'select-cat' | 'saved-plan';

interface CatWithPlanStatus extends Cat {
  hasPlan: boolean;
}

export default function CreatePlanChooserModal({
  isOpen,
  onClose,
}: CreatePlanChooserModalProps) {
  const [step, setStep] = useState<ModalStep>('choose');
  const [cats, setCats] = useState<CatWithPlanStatus[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Reset step when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('choose');
    }
  }, [isOpen]);

  // Fetch cats when selecting cat meal plan
  useEffect(() => {
    if (step === 'select-cat' && cats.length === 0) {
      const fetchCats = async () => {
        setIsLoadingCats(true);
        try {
          const { data } = await supabase
            .from('cats')
            .select('*')
            .order('name');

          if (data) {
            const catsWithStatus: CatWithPlanStatus[] = data.map((cat) => ({
              ...cat,
              hasPlan: !!cat.selected_food_id,
            }));
            setCats(catsWithStatus);
          }
        } catch (err) {
          console.error('Error fetching cats:', err);
        } finally {
          setIsLoadingCats(false);
        }
      };
      fetchCats();
    }
  }, [step, cats.length, supabase]);

  const handleCatMealPlanClick = () => {
    setStep('select-cat');
  };

  const handleSavedPlanClick = () => {
    setStep('saved-plan');
  };

  const handleSelectCat = (catId: string) => {
    onClose();
    router.push(`/cats/${catId}/recommendations`);
  };

  const handleSavedPlanSubmit = (data: {
    planName: string;
    targetDer: number;
    mealsPerDay: number;
    derivedFromWeight?: number;
    derivedFromAge?: number;
  }) => {
    const params = new URLSearchParams({
      name: data.planName,
      der: data.targetDer.toString(),
      meals: data.mealsPerDay.toString(),
    });
    if (data.derivedFromWeight) params.set('weight', data.derivedFromWeight.toString());
    if (data.derivedFromAge) params.set('age', data.derivedFromAge.toString());

    onClose();
    router.push(`/saved-plans/new?${params.toString()}`);
  };

  const handleBack = () => {
    setStep('choose');
  };

  // Render saved plan modal
  if (step === 'saved-plan') {
    return (
      <CreatePlanModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSavedPlanSubmit}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {step === 'choose' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
              What would you like to create?
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Choose how to build your meal plan
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Cat Meal Plan Option */}
              <button
                onClick={handleCatMealPlanClick}
                className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-center group"
              >
                <span className="text-4xl mb-3">🐱</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
                  Cat Meal Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create a meal plan for one of your cats
                </p>
              </button>

              {/* Saved Plan Option */}
              <button
                onClick={handleSavedPlanClick}
                className="flex flex-col items-center p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
              >
                <span className="text-4xl mb-3">📋</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Saved Plan
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create a plan without a cat profile
                </p>
              </button>
            </div>
          </>
        )}

        {step === 'select-cat' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Select a Cat
                </h2>
                <p className="text-sm text-gray-600">
                  Choose which cat to create a meal plan for
                </p>
              </div>
            </div>

            {isLoadingCats ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : cats.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-3 block">🐱</span>
                <p className="text-gray-600 mb-4">You haven&apos;t added any cats yet</p>
                <Button
                  onClick={() => {
                    onClose();
                    router.push('/cats/new');
                  }}
                >
                  Add Your First Cat
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCat(cat.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    {/* Cat Image */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-orange-50 border-2 border-orange-200 flex-shrink-0">
                      {cat.profile_image_url ? (
                        <Image
                          src={cat.profile_image_url}
                          alt={cat.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🐱
                        </div>
                      )}
                    </div>

                    {/* Cat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {cat.name}
                        </span>
                        {cat.hasPlan ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Has Plan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Needs Plan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {cat.breed} · {cat.weight_lbs} lbs
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {cat.hasPlan ? (
                        <span className="text-sm text-orange-600 font-medium">
                          Replace Plan
                        </span>
                      ) : (
                        <span className="text-sm text-orange-600 font-medium">
                          Create Plan
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {step === 'choose' && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}

      {step === 'select-cat' && cats.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between rounded-b-2xl">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </Modal>
  );
}
