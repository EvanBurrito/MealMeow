'use client';

import DownloadPDFButton from '@/components/pdf/DownloadPDFButton';
import { Cat, NutritionPlan, FoodRecommendation } from '@/types';

interface DownloadButtonProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
  recommendation: FoodRecommendation;
  disabled?: boolean;
}

export default function DownloadButton({
  cat,
  nutritionPlan,
  recommendation,
  disabled,
}: DownloadButtonProps) {
  return (
    <DownloadPDFButton
      cat={cat}
      nutritionPlan={nutritionPlan}
      recommendation={recommendation}
      disabled={disabled}
    />
  );
}
