import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <Header isLoggedIn={!!user} />

      <main>
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="text-8xl mb-6">🐱</div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Feed Your Cat
              <span className="text-orange-500"> Right</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Get personalized food recommendations based on your cat&apos;s age,
              weight, and health goals. Science-backed nutrition calculations to
              keep your feline friend healthy and happy.
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg">Get Started Free</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How MealMeow Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card variant="bordered" className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  1. Create Cat Profile
                </h3>
                <p className="text-gray-600">
                  Enter your cat&apos;s age, weight, breed, and activity level. We
                  support multiple cat profiles per account.
                </p>
              </Card>

              <Card variant="bordered" className="text-center">
                <div className="text-5xl mb-4">🔬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  2. Calculate Nutrition
                </h3>
                <p className="text-gray-600">
                  We use veterinary-approved formulas (RER/DER) to calculate your
                  cat&apos;s exact daily calorie needs.
                </p>
              </Card>

              <Card variant="bordered" className="text-center">
                <div className="text-5xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  3. Get Recommendations
                </h3>
                <p className="text-gray-600">
                  Browse personalized food options ranked by nutrition, cost, and
                  your budget preferences.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Nutrition Info Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Science-Based Calculations
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card variant="elevated">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Resting Energy Requirement (RER)
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-lg mb-4">
                  RER = 70 × (weight in kg)^0.75
                </div>
                <p className="text-gray-600">
                  The base metabolic calories your cat needs at rest, calculated
                  using the standard veterinary formula.
                </p>
              </Card>

              <Card variant="elevated">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Daily Energy Requirement (DER)
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-lg mb-4">
                  DER = RER × Life Stage Factor
                </div>
                <p className="text-gray-600">
                  Adjusted for your cat&apos;s age, activity level, and whether
                  they&apos;re neutered. Kittens need 2.5x, adults typically
                  1.2-1.4x.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-orange-500 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to optimize your cat&apos;s diet?
            </h2>
            <p className="text-orange-100 text-lg mb-8">
              Join thousands of cat parents making informed nutrition decisions.
            </p>
            {!user && (
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-orange-500 hover:bg-orange-50"
                >
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="flex items-center justify-center gap-2">
              <span className="text-2xl">🐱</span>
              <span className="font-semibold text-white">MealMeow</span>
            </p>
            <p className="mt-2 text-sm">
              Helping cats eat better, one meal at a time.
            </p>
            <p className="mt-4 text-xs">
              Disclaimer: Always consult your veterinarian for personalized dietary
              advice.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
