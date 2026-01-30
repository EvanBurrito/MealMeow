'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CatFood } from '@/types';
import Button from '@/components/ui/Button';

const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface SimpleFoodDetailModalProps {
  isOpen: boolean;
  food: CatFood | null;
  onClose: () => void;
}

export default function SimpleFoodDetailModal({
  isOpen,
  food,
  onClose,
}: SimpleFoodDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger enter animation after mount
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame to trigger fade-in after render
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, isClosing, handleClose]);

  if (!isOpen || !food) return null;

  return (
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
        className={`relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transition-all duration-200 ${
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
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{food.product_name}</h2>
                <p className="text-gray-600 text-sm">{food.brand}</p>
                {food.flavour && (
                  <p className="text-gray-500 text-xs mt-0.5">{food.flavour}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      food.food_type === 'dry'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {food.food_type === 'dry' ? 'Dry Food' : 'Wet Food'}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {food.life_stage === 'all' ? 'All Life Stages' : toTitleCase(food.life_stage)}
                  </span>
                </div>
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

          {/* Pricing */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              Pricing
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-gray-900">${food.price_per_unit.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Per Unit</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-gray-900">{food.unit_size}</p>
                <p className="text-xs text-gray-500">Package Size</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-base font-bold text-gray-900">{food.servings_per_unit}</p>
                <p className="text-xs text-gray-500">Servings/Unit</p>
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

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            {food.purchase_url ? (
              <a
                href={food.purchase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full">
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
              <Button disabled className="flex-1 opacity-50 cursor-not-allowed">
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
  );
}
