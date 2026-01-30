import { FoodSubmissionForm, FoodType } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

/**
 * Validate a food submission form
 */
export function validateFoodSubmission(data: Partial<FoodSubmissionForm>): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Required fields
  if (!data.brand?.trim()) {
    errors.brand = 'Brand is required';
  }
  if (!data.product_name?.trim()) {
    errors.product_name = 'Product name is required';
  }
  if (!data.unit_size?.trim()) {
    errors.unit_size = 'Unit size is required (e.g., "12 lb bag", "5.5 oz can")';
  }
  if (!data.food_type) {
    errors.food_type = 'Food type is required';
  }

  // Numeric validations
  if (data.price_per_unit === undefined || data.price_per_unit <= 0) {
    errors.price_per_unit = 'Price must be greater than 0';
  }

  if (data.protein_pct !== undefined) {
    if (data.protein_pct < 0 || data.protein_pct > 100) {
      errors.protein_pct = 'Protein % must be between 0 and 100';
    }
  } else {
    errors.protein_pct = 'Protein % is required';
  }

  if (data.fat_pct !== undefined) {
    if (data.fat_pct < 0 || data.fat_pct > 100) {
      errors.fat_pct = 'Fat % must be between 0 and 100';
    }
  } else {
    errors.fat_pct = 'Fat % is required';
  }

  if (data.fiber_pct !== undefined) {
    if (data.fiber_pct < 0 || data.fiber_pct > 100) {
      errors.fiber_pct = 'Fiber % must be between 0 and 100';
    }
  } else {
    errors.fiber_pct = 'Fiber % is required';
  }

  if (data.moisture_pct !== undefined) {
    if (data.moisture_pct < 0 || data.moisture_pct > 100) {
      errors.moisture_pct = 'Moisture % must be between 0 and 100';
    }
  }

  // Calorie validation based on food type
  if (data.food_type === 'dry') {
    if (!data.kcal_per_cup || data.kcal_per_cup <= 0) {
      errors.kcal_per_cup = 'Calories per cup is required for dry food';
    }
  }
  if (data.food_type === 'wet') {
    if (!data.kcal_per_can || data.kcal_per_can <= 0) {
      errors.kcal_per_can = 'Calories per can is required for wet food';
    }
    if (!data.can_size_oz || data.can_size_oz <= 0) {
      errors.can_size_oz = 'Can size (oz) is required for wet food';
    }
  }

  // Sanity checks (warnings, not errors)
  if (data.protein_pct !== undefined && data.protein_pct < 20) {
    warnings.push('Protein seems low for cat food (typically 25-40%). Please verify from the label.');
  }

  if (data.food_type === 'wet' && data.moisture_pct !== undefined && data.moisture_pct < 70) {
    warnings.push('Moisture seems low for wet food (typically 75-85%). Please verify.');
  }

  if (data.food_type === 'dry' && data.moisture_pct !== undefined && data.moisture_pct > 15) {
    warnings.push('Moisture seems high for dry food (typically 8-12%). Please verify.');
  }

  // Macros should add up reasonably (not exceed ~100% when accounting for ash, etc.)
  if (
    data.protein_pct !== undefined &&
    data.fat_pct !== undefined &&
    data.fiber_pct !== undefined &&
    data.moisture_pct !== undefined
  ) {
    const totalMacros = data.protein_pct + data.fat_pct + data.fiber_pct + data.moisture_pct;
    if (totalMacros > 110) {
      warnings.push('Total nutrient percentages seem high. Please verify the values from the label.');
    }
  }

  // Price sanity check
  if (data.price_per_unit && data.price_per_unit > 100) {
    warnings.push('Price per unit seems high. Please verify this is the correct price.');
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string>): string[] {
  return Object.values(errors);
}
