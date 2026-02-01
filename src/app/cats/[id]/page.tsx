import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Cat, PublicCat, SharedMealPlanWithFoods, CatFood } from '@/types';
import { formatAge, calculateNutritionPlan } from '@/lib/nutrition';
import { ACTIVITY_LEVELS } from '@/lib/constants';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InlineVisibilityToggle from '@/components/cats/InlineVisibilityToggle';
import InlineBioEditor from '@/components/cats/InlineBioEditor';
import InlineDetailsVisibilityToggle from '@/components/cats/InlineDetailsVisibilityToggle';
import CurrentMealPlanCard from '@/components/cats/CurrentMealPlanCard';
import FollowButton from '@/components/community/FollowButton';
import SharedPlanCard from '@/components/community/SharedPlanCard';

export const dynamic = 'force-dynamic';

interface CatPageProps {
  params: Promise<{ id: string }>;
}

export default async function CatPage({ params }: CatPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.is_admin || false;

  // Fetch cat without filtering by user_id
  const { data, error } = await supabase
    .from('cats')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const cat = data as Cat & {
    is_public?: boolean;
    bio?: string | null;
    followers_count?: number;
    show_details_public?: boolean;
  };
  const isOwner = cat.user_id === user.id;
  const isPublic = cat.is_public ?? false;
  const showDetailsPublic = cat.show_details_public ?? false;

  // If not owner and not public, return 404
  if (!isOwner && !isPublic) {
    notFound();
  }

  // Calculate nutrition plan (for owner view)
  const nutritionPlan = calculateNutritionPlan(cat);
  const genderText = cat.gender === 'male' ? 'Male' : 'Female';
  const activityLabel =
    ACTIVITY_LEVELS.find((a) => a.value === cat.activity_level)?.label ||
    cat.activity_level;

  // Fetch the cat's active food plan
  let primaryFood: CatFood | null = null;
  let secondaryFood: CatFood | null = null;

  if (cat.selected_food_id) {
    const foodIds = [cat.selected_food_id];
    if (cat.secondary_food_id) {
      foodIds.push(cat.secondary_food_id);
    }

    const { data: foodsData } = await supabase
      .from('cat_foods')
      .select('*')
      .in('id', foodIds);

    if (foodsData) {
      primaryFood =
        foodsData.find((f) => f.id === cat.selected_food_id) || null;
      if (cat.secondary_food_id) {
        secondaryFood =
          foodsData.find((f) => f.id === cat.secondary_food_id) || null;
      }
    }
  }

  const hasMealPlan = !!primaryFood;

  // For public view or owner, fetch additional community data
  let isFollowing = false;
  let plansWithFoods: SharedMealPlanWithFoods[] = [];

  if (isPublic || isOwner) {
    // Check if current user is following this cat (only if not owner)
    if (!isOwner) {
      const { data: followData } = await supabase
        .from('cat_follows')
        .select('id')
        .eq('follower_user_id', user.id)
        .eq('followed_cat_id', id)
        .single();

      isFollowing = !!followData;
    }

    // Fetch shared meal plans by this cat
    const { data: plansData } = await supabase
      .from('saved_meal_plans')
      .select('*')
      .eq('cat_id', id)
      .eq('is_shared', true)
      .order('shared_at', { ascending: false });

    const plans = plansData || [];

    // Get all food IDs from plans
    const allFoodIds = plans.flatMap((plan) =>
      (plan.food_selections as { foodId: string }[]).map((s) => s.foodId)
    );
    const uniqueFoodIds = [...new Set(allFoodIds)];

    // Fetch foods for shared plans
    const planFoodsMap = new Map<string, CatFood>();
    if (uniqueFoodIds.length > 0) {
      const { data: planFoodsData } = await supabase
        .from('cat_foods')
        .select('*')
        .in('id', uniqueFoodIds);

      if (planFoodsData) {
        planFoodsData.forEach((food) => {
          planFoodsMap.set(food.id, food);
        });
      }
    }

    // Fetch user's likes and saves for these plans
    const planIds = plans.map((p) => p.id);
    const userLikes = new Set<string>();
    const userSaves = new Set<string>();

    if (planIds.length > 0) {
      const [likesResult, savesResult] = await Promise.all([
        supabase
          .from('plan_likes')
          .select('plan_id')
          .eq('user_id', user.id)
          .in('plan_id', planIds),
        supabase
          .from('plan_saves')
          .select('plan_id')
          .eq('user_id', user.id)
          .in('plan_id', planIds),
      ]);

      if (likesResult.data) {
        likesResult.data.forEach((l) => userLikes.add(l.plan_id));
      }
      if (savesResult.data) {
        savesResult.data.forEach((s) => userSaves.add(s.plan_id));
      }
    }

    // Combine plans with foods
    plansWithFoods = plans.map((plan) => ({
      ...plan,
      food_selections: plan.food_selections as {
        foodId: string;
        mealCount: number;
      }[],
      health_focus: (plan.health_focus || []) as string[],
      cat: cat as PublicCat,
      foods: (plan.food_selections as { foodId: string }[])
        .map((s) => planFoodsMap.get(s.foodId))
        .filter((f): f is CatFood => f !== undefined),
      isLiked: userLikes.has(plan.id),
      isSaved: userSaves.has(plan.id),
    }));
  }

  // Calculate cat age display
  const ageYears = Math.floor(cat.age_months / 12);
  const ageMonthsRemainder = cat.age_months % 12;
  const ageDisplay =
    ageYears > 0
      ? `${ageYears} year${ageYears !== 1 ? 's' : ''}${
          ageMonthsRemainder > 0 ? ` ${ageMonthsRemainder} mo` : ''
        }`
      : `${cat.age_months} months`;

  // Determine if Cat Details should be visible to visitors
  const showDetailsToVisitor = !isOwner && isPublic && showDetailsPublic;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin={isAdmin} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-orange-500">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">{cat.name}</span>
        </div>

        {/* Profile Header Card */}
        <Card variant="elevated" className="mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-200 bg-orange-50 flex-shrink-0">
              {cat.profile_image_url ? (
                <Image
                  src={cat.profile_image_url}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  🐱
                </div>
              )}
            </div>

            {/* Cat Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>

                {/* Visibility toggle for owner, follow button for visitors */}
                {isOwner ? (
                  <InlineVisibilityToggle catId={cat.id} isPublic={isPublic} />
                ) : (
                  <FollowButton catId={cat.id} isFollowing={isFollowing} />
                )}

                {/* Edit button for owner */}
                {isOwner && (
                  <Link
                    href={`/cats/${cat.id}/edit`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Link>
                )}
              </div>

              {/* Cat details badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-600 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
                  {cat.breed}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
                  {ageDisplay} old
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
                  {cat.weight_lbs} lbs
                </span>
              </div>

              {/* Bio section - editable for owner, static for visitors */}
              {isOwner ? (
                <InlineBioEditor
                  catId={cat.id}
                  initialBio={cat.bio ?? null}
                  isPublic={isPublic}
                />
              ) : (
                cat.bio &&
                isPublic && <p className="text-gray-700 mb-4">{cat.bio}</p>
              )}

              {/* Community Stats - shown when public or owner */}
              {(isPublic || isOwner) && (
                <div className="flex justify-center md:justify-start gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {cat.followers_count || 0}
                    </div>
                    <div className="text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {plansWithFoods.length}
                    </div>
                    <div className="text-gray-500">Shared Plans</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Cat Details + Nutrition Summary Card - Owner view */}
        {isOwner && (
          <Card variant="elevated" className="mb-8 animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cat Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cat Details
                  </h2>
                  <InlineDetailsVisibilityToggle
                    catId={cat.id}
                    showDetailsPublic={showDetailsPublic}
                  />
                </div>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Age</dt>
                    <dd className="font-medium">{formatAge(cat.age_months)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Weight</dt>
                    <dd className="font-medium">{cat.weight_lbs} lbs</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Gender</dt>
                    <dd className="font-medium">{genderText}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Activity Level</dt>
                    <dd className="font-medium">{activityLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Weight Goal</dt>
                    <dd className="font-medium capitalize">{cat.goal}</dd>
                  </div>
                </dl>
              </div>

              {/* Nutrition Summary - always owner only */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Nutrition Summary
                </h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Daily Calories (DER)</dt>
                    <dd className="font-medium text-orange-600">
                      {nutritionPlan.der} kcal/day
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Resting Energy (RER)</dt>
                    <dd className="font-medium">{nutritionPlan.rer} kcal</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Life Stage Factor</dt>
                    <dd className="font-medium">
                      {nutritionPlan.factor}x ({nutritionPlan.factorName})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Recommended Meals/Day</dt>
                    <dd className="font-medium">{nutritionPlan.mealsPerDay}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Treat Budget</dt>
                    <dd className="font-medium">
                      {nutritionPlan.treatBudget} kcal
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href={`/cats/${cat.id}/recommendations`}>
                <Button size="lg" className="w-full">
                  Get Food Recommendations
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Cat Details - Visitor view (only if showDetailsPublic is true) */}
        {showDetailsToVisitor && (
          <Card variant="elevated" className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cat Details
            </h2>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Age</dt>
                <dd className="font-medium">{formatAge(cat.age_months)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Weight</dt>
                <dd className="font-medium">{cat.weight_lbs} lbs</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Breed</dt>
                <dd className="font-medium">{cat.breed}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Activity Level</dt>
                <dd className="font-medium">{activityLabel}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Goal</dt>
                <dd className="font-medium capitalize">{cat.goal}</dd>
              </div>
            </dl>
          </Card>
        )}

        {/* Current Meal Plan Section */}
        {hasMealPlan && primaryFood && (isOwner || isPublic) && (
          <div className="mb-8">
            <CurrentMealPlanCard
              cat={cat}
              food={primaryFood}
              secondaryFood={secondaryFood}
              isOwner={isOwner}
            />
          </div>
        )}

        {/* No meal plan message - owner only */}
        {!hasMealPlan && isOwner && (
          <Card
            variant="bordered"
            hover={false}
            className="text-center py-8 mb-8"
          >
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-600 mb-4">No meal plan yet</p>
            <Link href={`/cats/${cat.id}/recommendations`}>
              <Button>Get Recommendations</Button>
            </Link>
          </Card>
        )}

        {/* Shared Meal Plans Section - shown when public or owner */}
        {(isPublic || isOwner) && plansWithFoods.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Shared Meal Plans
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {plansWithFoods.map((plan) => (
                <SharedPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        )}

        {/* No shared plans message - only for visitors */}
        {!isOwner && isPublic && plansWithFoods.length === 0 && (
          <Card
            variant="bordered"
            hover={false}
            className="text-center py-12 mb-8"
          >
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-600">
              {cat.name} hasn&apos;t shared any meal plans yet.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
