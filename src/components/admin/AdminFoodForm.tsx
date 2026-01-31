'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { FoodType, LifeStage, CatFood, UserSubmittedFood } from '@/types';
import { SPECIAL_BENEFITS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface AdminFoodFormProps {
  mode: 'add' | 'edit-food' | 'edit-submission';
  existingFood?: CatFood;
  existingSubmission?: UserSubmittedFood;
  onSuccess?: () => void;
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

export default function AdminFoodForm({
  mode,
  existingFood,
  existingSubmission,
  onSuccess,
}: AdminFoodFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Get initial values from either existing food or submission
  const initial = existingFood || existingSubmission;

  const [formData, setFormData] = useState({
    brand: initial?.brand || '',
    product_name: initial?.product_name || '',
    food_type: (initial?.food_type || 'dry') as FoodType,
    life_stage: (initial?.life_stage || 'all') as LifeStage,
    kcal_per_cup: initial?.kcal_per_cup?.toString() || '',
    kcal_per_can: initial?.kcal_per_can?.toString() || '',
    can_size_oz: initial?.can_size_oz?.toString() || '',
    price_per_unit: initial?.price_per_unit?.toString() || '',
    unit_size: initial?.unit_size || '',
    servings_per_unit: initial?.servings_per_unit?.toString() || '1',
    protein_pct: initial?.protein_pct?.toString() || '',
    fat_pct: initial?.fat_pct?.toString() || '',
    fiber_pct: initial?.fiber_pct?.toString() || '',
    moisture_pct: initial?.moisture_pct?.toString() || '',
    special_benefits: initial?.special_benefits || [],
    is_complete_balanced: initial?.is_complete_balanced ?? true,
    image_url: initial?.image_url || '',
    flavour: initial?.flavour || '',
    purchase_url: initial?.purchase_url || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }));
      return;
    }

    setImageUploading(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    try {
      const fileName = `food-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('cat-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cat-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error('Upload error:', err);
      setErrors((prev) => ({ ...prev, image: 'Failed to upload image' }));
    } finally {
      setImageUploading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
    if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
      newErrors.price_per_unit = 'Valid price is required';
    }
    if (!formData.unit_size.trim()) newErrors.unit_size = 'Unit size is required';
    if (!formData.protein_pct) newErrors.protein_pct = 'Protein % is required';
    if (!formData.fat_pct) newErrors.fat_pct = 'Fat % is required';
    if (!formData.fiber_pct) newErrors.fiber_pct = 'Fiber % is required';

    if (formData.food_type === 'dry' && !formData.kcal_per_cup) {
      newErrors.kcal_per_cup = 'Calories per cup is required for dry food';
    }
    if (formData.food_type === 'wet') {
      if (!formData.kcal_per_can) newErrors.kcal_per_can = 'Calories per can is required for wet food';
      if (!formData.can_size_oz) newErrors.can_size_oz = 'Can size is required for wet food';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const foodData = {
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
        image_url: formData.image_url || null,
        flavour: formData.flavour.trim() || null,
        purchase_url: formData.purchase_url.trim() || null,
      };

      if (mode === 'add') {
        // Add directly to cat_foods
        const { error } = await supabase.from('cat_foods').insert(foodData);
        if (error) throw error;
        router.push('/database');
      } else if (mode === 'edit-food' && existingFood) {
        // Update existing food in cat_foods
        const { error } = await supabase
          .from('cat_foods')
          .update(foodData)
          .eq('id', existingFood.id);
        if (error) throw error;
        router.push('/database');
      } else if (mode === 'edit-submission' && existingSubmission) {
        // Update the submission
        const { error } = await supabase
          .from('user_submitted_foods')
          .update(foodData)
          .eq('id', existingSubmission.id);
        if (error) throw error;
        if (onSuccess) onSuccess();
      }

      router.refresh();
    } catch (err: unknown) {
      console.error('Error saving food:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        setSubmitError(String(err.message));
      } else {
        setSubmitError('Failed to save food');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === 'add'
    ? 'Add Food to Database'
    : mode === 'edit-food'
    ? 'Edit Food'
    : 'Edit Submission';

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 text-sm mb-6">
        {mode === 'add'
          ? 'Add a new food directly to the database (no approval required).'
          : 'Edit the food information below.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Image</h3>
          <div className="flex items-start gap-4">
            {formData.image_url && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={formData.image_url}
                  alt="Product"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input
                label="Image URL"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
                error={errors.image}
              />
              <div className="text-sm text-gray-500">or</div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUploading}
                />
                {imageUploading ? (
                  <span className="text-sm text-gray-600">Uploading...</span>
                ) : (
                  <span className="text-sm text-gray-700">Upload Image</span>
                )}
              </label>
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-3 gap-4">
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
            <Input
              label="Flavour"
              name="flavour"
              value={formData.flavour}
              onChange={handleChange}
              placeholder="e.g., Chicken & Rice"
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
          <Input
            label="Purchase URL"
            name="purchase_url"
            value={formData.purchase_url}
            onChange={handleChange}
            placeholder="https://..."
            helperText="Link where users can buy this product"
          />
        </div>

        {/* Nutrition */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Guaranteed Analysis (%)</h3>
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

        {/* Submit Error */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {mode === 'add' ? 'Add to Database' : 'Save Changes'}
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
