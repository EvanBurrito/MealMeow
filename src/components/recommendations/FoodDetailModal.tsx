'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CatFood, NutritionPlan } from '@/types';
import Button from '@/components/ui/Button';

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface FoodDetailModalProps {
  isOpen: boolean;
  food: CatFood | null;
  nutritionPlan: NutritionPlan;
  dailyAmount: number;
  amountUnit: string;
  dailyCost: number;
  monthlyCost: number;
  onClose: () => void;
  onAdd?: () => void;
  onDecrement?: () => void;
  onSelect?: () => void; // Legacy prop for recommendations page
  isSelected?: boolean;
  mealCount?: number;
  isMaxSelected?: boolean;
}

export default function FoodDetailModal({
  isOpen,
  food,
  nutritionPlan,
  dailyAmount,
  amountUnit,
  dailyCost,
  monthlyCost,
  onClose,
  onAdd,
  onDecrement,
  onSelect, // Legacy prop
  isSelected,
  mealCount = 0,
  isMaxSelected,
}: FoodDetailModalProps) {
  // Use onAdd if provided, otherwise fall back to onSelect for backward compatibility
  const handleAdd = onAdd || onSelect;
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if we're on the client
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Trigger enter animation after mount
  useEffect(() => {
    if (isOpen && isClient) {
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, isClient]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 200);
  }, [onClose]);

  if (!isOpen || !food || !isClient) return null;

  const amountPerMeal = Math.round((dailyAmount / nutritionPlan.mealsPerDay) * 100) / 100;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-orange-300 transition-all duration-200 ${
          isVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {food.image_url && (
                <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                  <Image
                    src={food.image_url}
                    alt={food.product_name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{food.product_name}</h2>
                <p className="text-gray-600 text-sm">{food.brand}</p>
                {food.flavour && (
                  <p className="text-gray-500 text-xs mt-0.5">{food.flavour}</p>
                )}
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                    food.food_type === 'dry'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {food.food_type === 'dry' ? 'Dry Food' : 'Wet Food'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Nutrition Info */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              Nutrition Information
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{food.protein_pct}%</p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{food.fat_pct}%</p>
                <p className="text-xs text-gray-500">Fat</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{food.fiber_pct}%</p>
                <p className="text-xs text-gray-500">Fiber</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{food.moisture_pct}%</p>
                <p className="text-xs text-gray-500">Moisture</p>
              </div>
            </div>
            <div className="mt-2 bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-600">
                {food.food_type === 'wet' ? food.kcal_per_can : food.kcal_per_cup} kcal
              </p>
              <p className="text-xs text-gray-500">
                per {food.food_type === 'wet' ? `can (${food.can_size_oz} oz)` : 'cup'}
              </p>
            </div>
          </div>

          {/* Feeding Schedule */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              Feeding Schedule
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-0.5">Daily Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {dailyAmount} {amountUnit}(s)
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-0.5">Per Meal</p>
                <p className="text-lg font-bold text-gray-900">
                  {amountPerMeal} {amountUnit}(s)
                </p>
                <p className="text-xs text-gray-500">{nutritionPlan.mealsPerDay} meals/day</p>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              Cost Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-gray-900">${dailyCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Daily</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-orange-600">${monthlyCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Monthly</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-gray-900">${food.price_per_unit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Per {food.food_type === 'wet' ? 'Can' : 'Unit'}</p>
              </div>
            </div>
          </div>

          {/* Special Benefits */}
          {food.special_benefits && food.special_benefits.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                Special Benefits
              </h3>
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

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            {/* Add/Remove buttons */}
            {(handleAdd || onDecrement) && (
              <div className="flex gap-2">
                {handleAdd && (
                  <Button
                    onClick={() => {
                      handleAdd();
                      // Don't close modal when adding in Build Your Own mode (onAdd provided)
                      // Close when using legacy onSelect behavior
                      if (onSelect && !onAdd) {
                        handleClose();
                      }
                    }}
                    disabled={isMaxSelected}
                    className="flex-1"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {onAdd ? (isSelected ? 'Add another meal' : 'Add to meal plan') : 'Select'}
                    </span>
                  </Button>
                )}
                {isSelected && onDecrement && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onDecrement();
                      // Close modal only if this will remove the food entirely
                      if (mealCount <= 1) {
                        handleClose();
                      }
                    }}
                    className={`flex-1 ${mealCount <= 1 ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      Remove
                    </span>
                  </Button>
                )}
              </div>
            )}

            {/* Selection status */}
            {isSelected && mealCount > 0 && (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
                <span className="text-emerald-700 font-medium">
                  Currently in plan: × {mealCount} meal{mealCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Purchase and Close buttons */}
            <div className="flex gap-2">
              {food.purchase_url ? (
                <a
                  href={food.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <span className="flex items-center justify-center gap-2">
                      Buy Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </span>
                  </Button>
                </a>
              ) : (
                <Button disabled variant="outline" className="flex-1 opacity-50 cursor-not-allowed">
                  Purchase Link Not Available
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
