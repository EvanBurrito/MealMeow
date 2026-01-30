'use client';

import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Cat, CatFood, FoodRecommendation, NutritionPlan, HealthCondition, RecommendationFeedback } from '@/types';
import { calculateNutritionPlan, generateRecommendations, getKcalPerUnit, getTotalKcalPerUnit, calculateCostPer100kcal, calculateDailyCost, calculateMonthlyCost } from '@/lib/nutrition';
import { trackRecommendationView, trackFilterChange } from '@/lib/analytics';
import Header from '@/components/layout/Header';
import NutritionSummary from '@/components/recommendations/NutritionSummary';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import RecommendationFilters from '@/components/recommendations/RecommendationFilters';
import FeedbackModal from '@/components/recommendations/FeedbackModal';
import FoodDetailModal from '@/components/recommendations/FoodDetailModal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';


interface RecommendationsPageProps {
  params: Promise<{ id: string }>;
}

export default function RecommendationsPage({ params }: RecommendationsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [cat, setCat] = useState<Cat | null>(null);
  const [foods, setFoods] = useState<CatFood[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Map<string, RecommendationFeedback>>(new Map());

  // Modal state
  const [feedbackModalFood, setFeedbackModalFood] = useState<CatFood | null>(null);
  const [detailModalRec, setDetailModalRec] = useState<FoodRecommendation | null>(null);

  // Filters
  const [foodType, setFoodType] = useState('dry');
  const [budget, setBudget] = useState('');
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUserId(user.id);

        // Load cat
        const { data: catData, error: catError } = await supabase
          .from('cats')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (catError || !catData) {
          setError('Cat not found');
          return;
        }

        setCat(catData);
        setHealthConditions(catData.health_conditions || []);
        const plan = calculateNutritionPlan(catData);
        setNutritionPlan(plan);

        // Load foods
        const { data: foodData, error: foodError } = await supabase
          .from('cat_foods')
          .select('*')
          .eq('is_complete_balanced', true);

        if (foodError) {
          console.error('Error loading foods:', foodError);
        }

        setFoods(foodData || []);

        // Load existing feedback for this cat
        const { data: feedbackData } = await supabase
          .from('recommendation_feedback')
          .select('*')
          .eq('user_id', user.id)
          .eq('cat_id', id);

        if (feedbackData) {
          const map = new Map<string, RecommendationFeedback>();
          feedbackData.forEach((fb: RecommendationFeedback) => map.set(fb.food_id, fb));
          setFeedbackMap(map);
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router, supabase]);

  useEffect(() => {
    if (cat && foods.length > 0) {
      // For hybrid, we still generate all recommendations for the hybrid diet calculation
      const filterType = foodType === 'hybrid' ? 'any' : foodType;
      const recs = generateRecommendations(cat, foods, {
        foodTypePreference: filterType as 'dry' | 'wet' | 'any',
        maxMonthlyBudget: budget ? parseFloat(budget) : undefined,
        healthConditions,
      });
      setRecommendations(recs);
    } else {
      setRecommendations([]);
    }
  }, [cat, foods, foodType, budget, healthConditions]);

  // Track recommendation views
  useEffect(() => {
    if (userId && cat && recommendations.length > 0) {
      const foodIds = recommendations.slice(0, 9).map((r) => r.food.id);
      trackRecommendationView(userId, cat.id, foodIds, {
        foodType,
        budget: budget || null,
        healthConditions,
      });
    }
  }, [userId, cat, recommendations, foodType, budget, healthConditions]);

  // Wrapper functions to track filter changes
  const handleFoodTypeChange = (value: string) => {
    setFoodType(value);
    if (userId && cat) {
      trackFilterChange(userId, cat.id, 'foodType', value);
    }
  };

  const handleBudgetChange = (value: string) => {
    setBudget(value);
    if (userId && cat) {
      trackFilterChange(userId, cat.id, 'budget', value);
    }
  };

  const handleHealthConditionsChange = (conditions: HealthCondition[]) => {
    setHealthConditions(conditions);
    if (userId && cat) {
      trackFilterChange(userId, cat.id, 'healthConditions', conditions);
    }
  };

  // Handle feedback save
  const handleFeedbackSaved = (feedback: RecommendationFeedback) => {
    setFeedbackMap((prev) => {
      const next = new Map(prev);
      next.set(feedback.food_id, feedback);
      return next;
    });
    setFeedbackModalFood(null);
  };

  // Generate hybrid diet recommendation (wet + dry combo)
  const hybridDiet = useMemo(() => {
    if (!nutritionPlan || foods.length === 0) return null;

    const dryFoods = foods.filter(f => f.food_type === 'dry');
    const wetFoods = foods.filter(f => f.food_type === 'wet');

    if (dryFoods.length === 0 || wetFoods.length === 0) return null;

    // Find best value dry and wet foods
    const dryRecs = generateRecommendations({ ...cat!, goal: cat!.goal }, dryFoods, { foodTypePreference: 'dry', healthConditions });
    const wetRecs = generateRecommendations({ ...cat!, goal: cat!.goal }, wetFoods, { foodTypePreference: 'wet', healthConditions });

    if (dryRecs.length === 0 || wetRecs.length === 0) return null;

    const bestDry = dryRecs[0];
    const bestWet = wetRecs[0];

    // 70% dry, 30% wet split
    const dryCalories = nutritionPlan.der * 0.7;
    const wetCalories = nutritionPlan.der * 0.3;

    const dryKcal = getKcalPerUnit(bestDry.food).kcal;
    const wetKcal = getKcalPerUnit(bestWet.food).kcal;

    const dailyDryAmount = dryCalories / dryKcal;
    const dailyWetAmount = wetCalories / wetKcal;

    const dryTotalKcal = getTotalKcalPerUnit(bestDry.food);
    const wetTotalKcal = getTotalKcalPerUnit(bestWet.food);

    const dryCostPer100 = calculateCostPer100kcal(bestDry.food.price_per_unit, dryTotalKcal);
    const wetCostPer100 = calculateCostPer100kcal(bestWet.food.price_per_unit, wetTotalKcal);

    const dailyDryCost = calculateDailyCost(dryCalories, dryCostPer100);
    const dailyWetCost = calculateDailyCost(wetCalories, wetCostPer100);
    const totalDailyCost = dailyDryCost + dailyWetCost;
    const totalMonthlyCost = calculateMonthlyCost(totalDailyCost);

    return {
      dry: bestDry.food,
      wet: bestWet.food,
      dailyDryAmount: Math.round(dailyDryAmount * 100) / 100,
      dailyWetAmount: Math.round(dailyWetAmount * 100) / 100,
      dailyCost: Math.round(totalDailyCost * 100) / 100,
      monthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    };
  }, [cat, foods, nutritionPlan, healthConditions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🐱</div>
            <p className="text-gray-600">Loading recommendations...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !cat || !nutritionPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Card variant="bordered" className="text-center py-12">
            <p className="text-red-600 mb-4">{error || 'Cat not found'}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-orange-500">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/cats/${cat.id}`} className="hover:text-orange-500">
            {cat.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Recommendations</span>
        </div>

        <div className="space-y-6 animate-fade-in">
          <NutritionSummary cat={cat} nutritionPlan={nutritionPlan} />

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Food Recommendations
            </h2>
            <RecommendationFilters
              foodType={foodType}
              budget={budget}
              healthConditions={healthConditions}
              onFoodTypeChange={handleFoodTypeChange}
              onBudgetChange={handleBudgetChange}
              onHealthConditionsChange={handleHealthConditionsChange}
            />
          </div>

          {foods.length === 0 && (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Foods in Database
              </h3>
              <p className="text-gray-600 mb-4">
                The food database is empty. Add some cat food products to get
                personalized recommendations.
              </p>
              <p className="text-sm text-gray-500">
                You can add foods directly through Supabase or build an admin
                interface.
              </p>
            </Card>
          )}

          {foods.length > 0 && recommendations.length === 0 && (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Matching Foods
              </h3>
              <p className="text-gray-600">
                No foods match your current filters. Try adjusting your preferences
                or budget.
              </p>
            </Card>
          )}

          {/* Hybrid Diet Section */}
          {foodType === 'hybrid' && hybridDiet && (
            <Card variant="bordered" className="bg-gradient-to-r from-amber-50 to-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🍽️</span>
                <h3 className="text-xl font-bold text-gray-900">Recommended: Mixed Diet</h3>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Best of Both</span>
              </div>
              <p className="text-gray-600 mb-4">
                A combination of wet and dry food provides hydration benefits from wet food and dental health from dry food.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">Dry</span>
                    <span className="text-sm text-gray-500">70% of calories</span>
                  </div>
                  <p className="font-semibold text-gray-900">{hybridDiet.dry.brand}</p>
                  <p className="text-sm text-gray-600">{hybridDiet.dry.product_name}</p>
                  <p className="text-orange-600 font-medium mt-2">{hybridDiet.dailyDryAmount} cups/day</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Wet</span>
                    <span className="text-sm text-gray-500">30% of calories</span>
                  </div>
                  <p className="font-semibold text-gray-900">{hybridDiet.wet.brand}</p>
                  <p className="text-sm text-gray-600">{hybridDiet.wet.product_name}</p>
                  <p className="text-orange-600 font-medium mt-2">{hybridDiet.dailyWetAmount} cans/day</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Estimated Monthly Cost</p>
                  <p className="text-xl font-bold text-orange-600">${hybridDiet.monthlyCost.toFixed(2)}/mo</p>
                </div>
                <p className="text-xs text-gray-500">(${hybridDiet.dailyCost.toFixed(2)}/day)</p>
              </div>
            </Card>
          )}

          {foodType === 'hybrid' && !hybridDiet && (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hybrid Diet Unavailable
              </h3>
              <p className="text-gray-600">
                Need both wet and dry food options in the database to create a hybrid diet plan.
              </p>
            </Card>
          )}

          {foodType !== 'hybrid' && recommendations.length > 0 && (
            <div key={foodType} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {recommendations.slice(0, 9).map((rec, index) => (
                <RecommendationCard
                  key={rec.food.id}
                  recommendation={rec}
                  nutritionPlan={nutritionPlan}
                  rank={index + 1}
                  cat={cat}
                  catId={cat.id}
                  userId={userId || undefined}
                  feedback={feedbackMap.get(rec.food.id)}
                  onOpenFeedbackModal={() => setFeedbackModalFood(rec.food)}
                  onCardClick={() => setDetailModalRec(rec)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Centralized Feedback Modal */}
      {userId && feedbackModalFood && (
        <FeedbackModal
          isOpen={!!feedbackModalFood}
          food={feedbackModalFood}
          catId={cat.id}
          userId={userId}
          existingFeedback={feedbackMap.get(feedbackModalFood.id)}
          onClose={() => setFeedbackModalFood(null)}
          onSaved={handleFeedbackSaved}
        />
      )}

      {/* Food Detail Modal */}
      {detailModalRec && (
        <FoodDetailModal
          food={detailModalRec.food}
          nutritionPlan={nutritionPlan}
          dailyAmount={detailModalRec.dailyAmount}
          amountUnit={detailModalRec.amountUnit}
          dailyCost={detailModalRec.dailyCost}
          monthlyCost={detailModalRec.monthlyCost}
          onClose={() => setDetailModalRec(null)}
        />
      )}
    </div>
  );
}
