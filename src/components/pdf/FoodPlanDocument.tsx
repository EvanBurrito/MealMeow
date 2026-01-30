import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { Cat, NutritionPlan, FoodRecommendation } from '@/types';

// Register Quicksand - bubbly rounded font
Font.register({
  family: 'Quicksand',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/quicksand@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Cute & bubbly color palette
const colors = {
  // Warm pastels
  peach: '#ffecd2',
  coral: '#ff9a8b',
  cream: '#fff8f0',
  softPink: '#ffd6e0',
  mintGreen: '#d4f5e9',
  lavender: '#e8e0f0',

  // Primary orange (brand)
  orange500: '#f97316',
  orange600: '#ea580c',
  orange100: '#ffedd5',
  orange200: '#fed7aa',

  // Soft text colors
  warmBrown: '#5d4e4e',
  softGray: '#8b7e7e',
  lightGray: '#b8aeae',

  // Utility
  white: '#ffffff',

  // Badge colors
  amber100: '#fef3c7',
  amber700: '#b45309',
  blue100: '#dbeafe',
  blue700: '#1d4ed8',
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Quicksand',
    fontSize: 10,
    color: colors.warmBrown,
    backgroundColor: colors.cream,
  },

  // Compact Header with cat profile inline
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.peach,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 18,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange500,
  },
  // Cat profile picture - compact round with cute border
  catImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softPink,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catImageInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  catImage: {
    width: 36,
    height: 36,
    objectFit: 'cover',
  },
  catImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.peach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange500,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  catName: {
    fontSize: 14,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.warmBrown,
    letterSpacing: 0.3,
  },
  catStats: {
    fontSize: 8,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.softGray,
    marginTop: 2,
  },

  // Hero Feeding Section - THE STAR OF THE SHOW
  heroSection: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: colors.peach,
    borderRadius: 18,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  mealCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  mealCard: {
    width: 130,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.orange100,
  },
  mealLabel: {
    fontSize: 10,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  mealTime: {
    fontSize: 8,
    fontFamily: 'Quicksand',
    color: colors.softGray,
    marginBottom: 4,
  },
  mealDivider: {
    width: 24,
    height: 2,
    backgroundColor: colors.peach,
    borderRadius: 1,
    marginBottom: 4,
  },
  mealAmount: {
    fontSize: 20,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.warmBrown,
  },
  mealUnit: {
    fontSize: 9,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.softGray,
    marginTop: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand',
    fontWeight: 600,
    color: colors.softGray,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange600,
  },
  totalCalories: {
    fontSize: 10,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.softGray,
  },

  // Compact Food Section with Image
  foodSection: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  foodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  // Food image - smaller with cute border
  foodImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.lavender,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImageInner: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  foodImage: {
    width: 52,
    height: 52,
    objectFit: 'cover',
  },
  foodImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodPlaceholderText: {
    fontSize: 16,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.lightGray,
  },
  foodContent: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  foodName: {
    fontSize: 12,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.warmBrown,
    flex: 1,
  },
  foodBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  badgeDry: {
    backgroundColor: colors.amber100,
  },
  badgeWet: {
    backgroundColor: colors.blue100,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: 'Quicksand',
    fontWeight: 700,
  },
  badgeDryText: {
    color: colors.amber700,
  },
  badgeWetText: {
    color: colors.blue700,
  },
  foodBrand: {
    fontSize: 9,
    fontFamily: 'Quicksand',
    color: colors.softGray,
    marginBottom: 3,
  },
  foodCostRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  foodCost: {
    fontSize: 12,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange600,
  },
  foodCostPeriod: {
    fontSize: 9,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.softGray,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lavender,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 8,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.softGray,
    marginRight: 2,
  },
  nutritionValue: {
    fontSize: 8,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.warmBrown,
  },

  // Compact Tip Section
  tipSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.mintGreen,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  tipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIconText: {
    fontSize: 10,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange500,
  },
  tipText: {
    fontSize: 9,
    fontFamily: 'Quicksand',
    fontWeight: 500,
    color: colors.warmBrown,
    flex: 1,
  },

  // Minimal Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.peach,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 10,
    fontFamily: 'Quicksand',
    fontWeight: 700,
    color: colors.orange500,
  },
  footerText: {
    fontSize: 7,
    fontFamily: 'Quicksand',
    color: colors.lightGray,
  },
});

// Helper functions
function formatAge(ageMonths: number): string {
  if (ageMonths < 12) {
    return `${ageMonths}mo`;
  }
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (months === 0) {
    return `${years}y`;
  }
  return `${years}y ${months}mo`;
}

function getMealTimes(mealsPerDay: number): Array<{ label: string; time: string }> {
  if (mealsPerDay === 2) {
    return [
      { label: 'Morning', time: '7-8 AM' },
      { label: 'Evening', time: '5-6 PM' },
    ];
  } else if (mealsPerDay === 3) {
    return [
      { label: 'Morning', time: '7-8 AM' },
      { label: 'Midday', time: '12-1 PM' },
      { label: 'Evening', time: '5-6 PM' },
    ];
  }
  return [
    { label: 'Morning', time: '7-8 AM' },
    { label: 'Evening', time: '5-6 PM' },
  ];
}

interface FoodPlanDocumentProps {
  cat: Cat;
  nutritionPlan: NutritionPlan;
  recommendation: FoodRecommendation;
  catImageBase64?: string | null;
  foodImageBase64?: string | null;
}

export default function FoodPlanDocument({
  cat,
  nutritionPlan,
  recommendation,
  catImageBase64,
  foodImageBase64,
}: FoodPlanDocumentProps) {
  const { food, dailyAmount, amountUnit, amountPerMeal, monthlyCost } = recommendation;

  const mealTimes = getMealTimes(nutritionPlan.mealsPerDay);
  const showThreeMeals = nutritionPlan.mealsPerDay === 3;

  // Get first letter of cat name for placeholder
  const catInitial = cat.name.charAt(0).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Cat Profile */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>MealMeow</Text>
            {/* Cat profile picture with cute round border */}
            <View style={styles.catImageWrapper}>
              {catImageBase64 ? (
                <View style={styles.catImageInner}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't use alt */}
                  <Image src={catImageBase64} style={styles.catImage} />
                </View>
              ) : (
                <View style={styles.catImagePlaceholder}>
                  <Text style={styles.catPlaceholderText}>{catInitial}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.catName}>{cat.name}&apos;s Food Plan</Text>
            <Text style={styles.catStats}>
              {formatAge(cat.age_months)} · {cat.weight_lbs} lbs · {cat.breed || 'Mixed'}
            </Text>
          </View>
        </View>

        {/* Hero: Feeding Guide - THE STAR OF THE SHOW */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Daily Feeding Guide</Text>

          {showThreeMeals ? (
            <View style={styles.mealCardsRow}>
              {mealTimes.map((meal, index) => (
                <View key={index} style={[styles.mealCard, { width: 95 }]}>
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  <View style={styles.mealDivider} />
                  <Text style={[styles.mealAmount, { fontSize: 16 }]}>{amountPerMeal}</Text>
                  <Text style={styles.mealUnit}>{amountUnit}{amountPerMeal !== 1 ? 's' : ''}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.mealCardsRow}>
              {mealTimes.slice(0, 2).map((meal, index) => (
                <View key={index} style={styles.mealCard}>
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  <View style={styles.mealDivider} />
                  <Text style={styles.mealAmount}>{amountPerMeal}</Text>
                  <Text style={styles.mealUnit}>{amountUnit}{amountPerMeal !== 1 ? 's' : ''}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {dailyAmount} {amountUnit}{dailyAmount !== 1 ? 's' : ''}/day
            </Text>
            <Text style={styles.totalCalories}>({Math.round(nutritionPlan.der)} kcal)</Text>
          </View>
        </View>

        {/* Food Info with Image */}
        <View style={styles.foodSection}>
          <View style={styles.foodRow}>
            {/* Food Image with cute border */}
            <View style={styles.foodImageWrapper}>
              {foodImageBase64 ? (
                <View style={styles.foodImageInner}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't use alt */}
                  <Image src={foodImageBase64} style={styles.foodImage} />
                </View>
              ) : (
                <View style={styles.foodImagePlaceholder}>
                  <Text style={styles.foodPlaceholderText}>?</Text>
                </View>
              )}
            </View>

            {/* Food Details */}
            <View style={styles.foodContent}>
              <View style={styles.foodHeader}>
                <Text style={styles.foodName}>{food.product_name}</Text>
                <View style={[styles.foodBadge, food.food_type === 'dry' ? styles.badgeDry : styles.badgeWet]}>
                  <Text style={[styles.badgeText, food.food_type === 'dry' ? styles.badgeDryText : styles.badgeWetText]}>
                    {food.food_type === 'dry' ? 'Dry' : 'Wet'}
                  </Text>
                </View>
              </View>
              <Text style={styles.foodBrand}>{food.brand}</Text>
              <View style={styles.foodCostRow}>
                <Text style={styles.foodCost}>${monthlyCost.toFixed(2)}</Text>
                <Text style={styles.foodCostPeriod}>/mo</Text>
              </View>
            </View>
          </View>

          {/* Nutrition Row */}
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>{food.protein_pct}%</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>{food.fat_pct}%</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fiber</Text>
              <Text style={styles.nutritionValue}>{food.fiber_pct}%</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>{food.food_type === 'dry' ? 'kcal/cup' : 'kcal/can'}</Text>
              <Text style={styles.nutritionValue}>
                {food.food_type === 'dry' ? food.kcal_per_cup : food.kcal_per_can}
              </Text>
            </View>
          </View>
        </View>

        {/* Friendly Tip */}
        <View style={styles.tipSection}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipIconText}>!</Text>
          </View>
          <Text style={styles.tipText}>
            Keep fresh water available at all times! Adjust portions if your cat is gaining or losing weight.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>MealMeow</Text>
          <Text style={styles.footerText}>Always consult your vet for dietary advice</Text>
        </View>
      </Page>
    </Document>
  );
}
