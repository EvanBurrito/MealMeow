export const CAT_BREEDS = [
  'Domestic Shorthair',
  'Domestic Longhair',
  'Domestic Medium Hair',
  'Abyssinian',
  'American Bobtail',
  'American Curl',
  'American Shorthair',
  'American Wirehair',
  'Balinese',
  'Bengal',
  'Birman',
  'Bombay',
  'British Shorthair',
  'Burmese',
  'Burmilla',
  'Chartreux',
  'Cornish Rex',
  'Devon Rex',
  'Egyptian Mau',
  'Exotic Shorthair',
  'Havana Brown',
  'Himalayan',
  'Japanese Bobtail',
  'Javanese',
  'Korat',
  'LaPerm',
  'Maine Coon',
  'Manx',
  'Munchkin',
  'Norwegian Forest Cat',
  'Ocicat',
  'Oriental',
  'Persian',
  'Ragamuffin',
  'Ragdoll',
  'Russian Blue',
  'Savannah',
  'Scottish Fold',
  'Selkirk Rex',
  'Siamese',
  'Siberian',
  'Singapura',
  'Snowshoe',
  'Somali',
  'Sphynx',
  'Tonkinese',
  'Turkish Angora',
  'Turkish Van',
  'Mixed Breed',
  'Unknown',
] as const;

export const ACTIVITY_LEVELS = [
  { value: 'inactive', label: 'Indoor Cat' },
  { value: 'normal', label: 'Moderate Activity' },
  { value: 'active', label: 'High Activity / Outdoor Access' },
] as const;

export const GOALS = [
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'lose', label: 'Lose Weight' },
  { value: 'gain', label: 'Gain Weight' },
] as const;

export const FOOD_TYPES = [
  { value: 'any', label: 'Any type' },
  { value: 'dry', label: 'Dry food only' },
  { value: 'wet', label: 'Wet food only' },
] as const;

export const SPECIAL_BENEFITS = [
  'Hairball Control',
  'Weight Management',
  'Urinary Health',
  'Sensitive Stomach',
  'Dental Health',
  'Skin & Coat',
  'Joint Support',
  'Indoor Formula',
  'High Protein',
  'Grain Free',
] as const;

export const HEALTH_CONDITIONS = [
  { value: 'weight_management', label: 'Weight Management', description: 'Overweight or obesity-prone' },
  { value: 'sensitive_stomach', label: 'Sensitive Stomach', description: 'Digestive issues or food sensitivities' },
  { value: 'urinary_health', label: 'Urinary Health', description: 'History of UTIs or urinary crystals' },
  { value: 'hairball_control', label: 'Hairball Control', description: 'Frequent hairball issues' },
  { value: 'dental_health', label: 'Dental Health', description: 'Dental problems or tartar buildup' },
  { value: 'skin_coat', label: 'Skin & Coat', description: 'Dry skin or coat issues' },
  { value: 'joint_support', label: 'Joint Support', description: 'Arthritis or mobility issues' },
  { value: 'kidney_support', label: 'Kidney Support', description: 'Kidney disease or senior cat needs' },
  { value: 'diabetic', label: 'Diabetic', description: 'Diabetes or blood sugar management' },
] as const;

// Mapping of health conditions to required/preferred food benefits
export const HEALTH_CONDITION_REQUIREMENTS: Record<
  string,
  {
    requiredBenefits: string[];
    preferredBenefits: string[];
    maxFatPct?: number;
    minProteinPct?: number;
    maxFiberPct?: number;
  }
> = {
  weight_management: {
    requiredBenefits: ['Weight Management'],
    preferredBenefits: ['Indoor Formula'],
    maxFatPct: 12,
  },
  sensitive_stomach: {
    requiredBenefits: ['Sensitive Stomach'],
    preferredBenefits: ['Grain Free'],
    maxFiberPct: 5,
  },
  urinary_health: {
    requiredBenefits: ['Urinary Health'],
    preferredBenefits: [],
  },
  hairball_control: {
    requiredBenefits: ['Hairball Control'],
    preferredBenefits: ['Indoor Formula'],
  },
  dental_health: {
    requiredBenefits: ['Dental Health'],
    preferredBenefits: [],
  },
  skin_coat: {
    requiredBenefits: ['Skin & Coat'],
    preferredBenefits: [],
  },
  joint_support: {
    requiredBenefits: ['Joint Support'],
    preferredBenefits: [],
  },
  kidney_support: {
    requiredBenefits: [],
    preferredBenefits: [],
    // Lower protein for kidney support - handled specially
  },
  diabetic: {
    requiredBenefits: ['High Protein'],
    preferredBenefits: [],
    minProteinPct: 40,
    maxFatPct: 15,
  },
};
