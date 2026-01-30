'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FoodType, LifeStage, UserSubmittedFood } from '@/types';
import { validateFoodSubmission } from '@/lib/validation';
import { SPECIAL_BENEFITS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface FoodSubmissionFormProps {
  userId: string;
  existingSubmission?: UserSubmittedFood;
  mode: 'create' | 'edit';
}

const FOOD_TYPE_OPTIONS = [
  { value: 'dry', label: 'Dry Food' },
  { value: 'wet', label: 'Wet Food' },
];

const LIFE_STAGE_OPTIONS = [
  { value: 'all', label: 'All Life Stages' },
  { value: 'kitten', label: 'Kitten' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Senior' },
];

export default function FoodSubmissionForm({
  userId,
  existingSubmission,
  mode,
}: FoodSubmissionFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    brand: existingSubmission?.brand || '',
    product_name: existingSubmission?.product_name || '',
    food_type: (existingSubmission?.food_type || 'dry') as FoodType,
    life_stage: (existingSubmission?.life_stage || 'all') as LifeStage,
    kcal_per_cup: existingSubmission?.kcal_per_cup?.toString() || '',
    kcal_per_can: existingSubmission?.kcal_per_can?.toString() || '',
    can_size_oz: existingSubmission?.can_size_oz?.toString() || '',
    price_per_unit: existingSubmission?.price_per_unit?.toString() || '',
    unit_size: existingSubmission?.unit_size || '',
    servings_per_unit: existingSubmission?.servings_per_unit?.toString() || '1',
    protein_pct: existingSubmission?.protein_pct?.toString() || '',
    fat_pct: existingSubmission?.fat_pct?.toString() || '',
    fiber_pct: existingSubmission?.fiber_pct?.toString() || '',
    moisture_pct: existingSubmission?.moisture_pct?.toString() || '',
    special_benefits: existingSubmission?.special_benefits || [],
    is_complete_balanced: existingSubmission?.is_complete_balanced ?? true,
    source_url: existingSubmission?.source_url || '',
    notes: existingSubmission?.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBenefitToggle = (benefit: string) => {
    setFormData((prev) => ({
      ...prev,
      special_benefits: prev.special_benefits.includes(benefit)
        ? prev.special_benefits.filter((b) => b !== benefit)
        : [...prev.special_benefits, benefit],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate form
    const validation = validateFoodSubmission({
      brand: formData.brand,
      product_name: formData.product_name,
      food_type: formData.food_type,
      life_stage: formData.life_stage,
      kcal_per_cup: formData.kcal_per_cup ? parseFloat(formData.kcal_per_cup) : undefined,
      kcal_per_can: formData.kcal_per_can ? parseFloat(formData.kcal_per_can) : undefined,
      can_size_oz: formData.can_size_oz ? parseFloat(formData.can_size_oz) : undefined,
      price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : 0,
      unit_size: formData.unit_size,
      servings_per_unit: parseFloat(formData.servings_per_unit) || 1,
      protein_pct: formData.protein_pct ? parseFloat(formData.protein_pct) : undefined,
      fat_pct: formData.fat_pct ? parseFloat(formData.fat_pct) : undefined,
      fiber_pct: formData.fiber_pct ? parseFloat(formData.fiber_pct) : undefined,
      moisture_pct: formData.moisture_pct ? parseFloat(formData.moisture_pct) : 0,
      special_benefits: formData.special_benefits,
      is_complete_balanced: formData.is_complete_balanced,
      source_url: formData.source_url || undefined,
      notes: formData.notes || undefined,
    });

    setErrors(validation.errors);
    setWarnings(validation.warnings);

    if (!validation.valid) {
      return;
    }

    setIsLoading(true);

    try {
      const submissionData = {
        submitted_by: userId,
        brand: formData.brand.trim(),
        product_name: formData.product_name.trim(),
        food_type: formData.food_type,
        life_stage: formData.life_stage,
        kcal_per_cup: formData.food_type === 'dry' ? parseFloat(formData.kcal_per_cup) : null,
        kcal_per_can: formData.food_type === 'wet' ? parseFloat(formData.kcal_per_can) : null,
        can_size_oz: formData.food_type === 'wet' ? parseFloat(formData.can_size_oz) : null,
        price_per_unit: parseFloat(formData.price_per_unit),
        unit_size: formData.unit_size.trim(),
        servings_per_unit: parseFloat(formData.servings_per_unit) || 1,
        protein_pct: parseFloat(formData.protein_pct),
        fat_pct: parseFloat(formData.fat_pct),
        fiber_pct: parseFloat(formData.fiber_pct),
        moisture_pct: parseFloat(formData.moisture_pct) || 0,
        special_benefits: formData.special_benefits,
        is_complete_balanced: formData.is_complete_balanced,
        source_url: formData.source_url.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending' as const,
      };

      if (mode === 'create') {
        const { error } = await supabase.from('user_submitted_foods').insert(submissionData);
        if (error) throw error;
      } else if (existingSubmission) {
        const { error } = await supabase
          .from('user_submitted_foods')
          .update(submissionData)
          .eq('id', existingSubmission.id);
        if (error) throw error;
      }

      router.push('/foods/my-submissions');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error submitting food:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        setSubmitError(String(err.message));
      } else {
        setSubmitError('Failed to submit food');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {mode === 'create' ? 'Submit New Food' : 'Edit Submission'}
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Help expand our food database by submitting a cat food product. Please provide accurate
        information from the product label.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g., Blue Buffalo"
              error={errors.brand}
              required
            />
            <Input
              label="Product Name"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="e.g., Wilderness Chicken"
              error={errors.product_name}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Food Type"
              name="food_type"
              value={formData.food_type}
              onChange={handleChange}
              options={FOOD_TYPE_OPTIONS}
            />
            <Select
              label="Life Stage"
              name="life_stage"
              value={formData.life_stage}
              onChange={handleChange}
              options={LIFE_STAGE_OPTIONS}
            />
          </div>
        </div>

        {/* Calorie Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Calorie Information</h3>
          {formData.food_type === 'dry' ? (
            <Input
              type="number"
              label="Calories per Cup (kcal)"
              name="kcal_per_cup"
              value={formData.kcal_per_cup}
              onChange={handleChange}
              placeholder="e.g., 400"
              min="0"
              step="1"
              error={errors.kcal_per_cup}
              required
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Calories per Can (kcal)"
                name="kcal_per_can"
                value={formData.kcal_per_can}
                onChange={handleChange}
                placeholder="e.g., 80"
                min="0"
                step="1"
                error={errors.kcal_per_can}
                required
              />
              <Input
                type="number"
                label="Can Size (oz)"
                name="can_size_oz"
                value={formData.can_size_oz}
                onChange={handleChange}
                placeholder="e.g., 5.5"
                min="0"
                step="0.1"
                error={errors.can_size_oz}
                required
              />
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Price per Unit ($)"
              name="price_per_unit"
              value={formData.price_per_unit}
              onChange={handleChange}
              placeholder="e.g., 45.99"
              min="0"
              step="0.01"
              error={errors.price_per_unit}
              required
            />
            <Input
              label="Unit Size"
              name="unit_size"
              value={formData.unit_size}
              onChange={handleChange}
              placeholder="e.g., 12 lb bag"
              error={errors.unit_size}
              required
            />
            <Input
              type="number"
              label="Servings per Unit"
              name="servings_per_unit"
              value={formData.servings_per_unit}
              onChange={handleChange}
              placeholder="e.g., 48"
              min="1"
              step="0.1"
            />
          </div>
        </div>

        {/* Nutrition */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Guaranteed Analysis (%)</h3>
          <p className="text-sm text-gray-500 -mt-2">
            Enter values from the guaranteed analysis on the package label
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Protein %"
              name="protein_pct"
              value={formData.protein_pct}
              onChange={handleChange}
              placeholder="e.g., 35"
              min="0"
              max="100"
              step="0.1"
              error={errors.protein_pct}
              required
            />
            <Input
              type="number"
              label="Fat %"
              name="fat_pct"
              value={formData.fat_pct}
              onChange={handleChange}
              placeholder="e.g., 15"
              min="0"
              max="100"
              step="0.1"
              error={errors.fat_pct}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Fiber %"
              name="fiber_pct"
              value={formData.fiber_pct}
              onChange={handleChange}
              placeholder="e.g., 5"
              min="0"
              max="100"
              step="0.1"
              error={errors.fiber_pct}
              required
            />
            <Input
              type="number"
              label="Moisture %"
              name="moisture_pct"
              value={formData.moisture_pct}
              onChange={handleChange}
              placeholder="e.g., 10"
              min="0"
              max="100"
              step="0.1"
              error={errors.moisture_pct}
            />
          </div>
        </div>

        {/* Special Benefits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Special Benefits</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_BENEFITS.map((benefit) => (
              <button
                key={benefit}
                type="button"
                onClick={() => handleBenefitToggle(benefit)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  formData.special_benefits.includes(benefit)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {benefit}
              </button>
            ))}
          </div>
        </div>

        {/* Complete & Balanced */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_complete_balanced"
            name="is_complete_balanced"
            checked={formData.is_complete_balanced}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <label htmlFor="is_complete_balanced" className="text-sm font-medium text-gray-700">
            AAFCO Complete & Balanced
          </label>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
          <Input
            label="Product URL (optional)"
            name="source_url"
            value={formData.source_url}
            onChange={handleChange}
            placeholder="https://..."
            helperText="Link to the product page for verification"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this product..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Please Review</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {mode === 'create' ? 'Submit for Review' : 'Update Submission'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
