'use client';

import { useState } from 'react';
import { Cat, NutritionPlan, FoodRecommendation } from '@/types';

interface DownloadPDFButtonProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
  recommendation: FoodRecommendation;
  disabled?: boolean;
}

// Convert image URL to base64 data URI via server proxy (avoids CORS)
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;

    const data = await response.json();
    return data.dataUri || null;
  } catch {
    return null;
  }
}

export default function DownloadPDFButton({
  cat,
  nutritionPlan,
  recommendation,
  disabled,
}: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isGenerating) return;

    setIsGenerating(true);
    try {
      // Fetch and convert images to base64 in parallel
      const [catImageBase64, foodImageBase64] = await Promise.all([
        cat.profile_image_url ? imageUrlToBase64(cat.profile_image_url) : Promise.resolve(null),
        recommendation.food.image_url ? imageUrlToBase64(recommendation.food.image_url) : Promise.resolve(null),
      ]);

      // Dynamic import to avoid Turbopack bundling issues
      const [{ pdf }, { saveAs }, { default: FoodPlanDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('file-saver'),
        import('./FoodPlanDocument'),
      ]);

      const blob = await pdf(
        FoodPlanDocument({
          cat,
          nutritionPlan,
          recommendation,
          catImageBase64,
          foodImageBase64,
        })
      ).toBlob();

      const fileName = `${cat.name.replace(/[^a-zA-Z0-9]/g, '_')}_food_plan.pdf`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || isGenerating}
      onClick={handleDownload}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        disabled || isGenerating
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title="Download food plan as PDF"
    >
      {isGenerating ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>PDF</span>
        </>
      )}
    </button>
  );
}
