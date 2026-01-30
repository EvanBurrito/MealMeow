'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { CatFood, FoodType, LifeStage } from '@/types';
import FoodCard from './FoodCard';
import FoodDatabaseFilters from './FoodDatabaseFilters';
import SimpleFoodDetailModal from './SimpleFoodDetailModal';
import Card from '@/components/ui/Card';

interface FoodDatabaseListProps {
  foods: CatFood[];
}

export default function FoodDatabaseList({ foods }: FoodDatabaseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodType, setFoodType] = useState<FoodType | 'all'>('all');
  const [lifeStage, setLifeStage] = useState<LifeStage | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<CatFood | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const prevFilterRef = useRef({ searchQuery: '', foodType: 'all', lifeStage: 'all' });

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBrand = food.brand.toLowerCase().includes(query);
        const matchesProduct = food.product_name.toLowerCase().includes(query);
        if (!matchesBrand && !matchesProduct) {
          return false;
        }
      }

      // Food type filter
      if (foodType !== 'all' && food.food_type !== foodType) {
        return false;
      }

      // Life stage filter
      if (lifeStage !== 'all') {
        if (food.life_stage !== lifeStage && food.life_stage !== 'all') {
          return false;
        }
      }

      return true;
    });
  }, [foods, searchQuery, foodType, lifeStage]);

  // Trigger animation when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value !== prevFilterRef.current.searchQuery) {
      setAnimationKey(k => k + 1);
      prevFilterRef.current.searchQuery = value;
    }
  }, []);

  const handleFoodTypeChange = useCallback((value: FoodType | 'all') => {
    setFoodType(value);
    if (value !== prevFilterRef.current.foodType) {
      setAnimationKey(k => k + 1);
      prevFilterRef.current.foodType = value;
    }
  }, []);

  const handleLifeStageChange = useCallback((value: LifeStage | 'all') => {
    setLifeStage(value);
    if (value !== prevFilterRef.current.lifeStage) {
      setAnimationKey(k => k + 1);
      prevFilterRef.current.lifeStage = value;
    }
  }, []);

  return (
    <>
      <FoodDatabaseFilters
        searchQuery={searchQuery}
        foodType={foodType}
        lifeStage={lifeStage}
        onSearchChange={handleSearchChange}
        onFoodTypeChange={handleFoodTypeChange}
        onLifeStageChange={handleLifeStageChange}
      />

      {filteredFoods.length === 0 ? (
        <Card variant="bordered" className="text-center py-12 animate-fade-in">
          <div className="text-6xl mb-4">
            {foods.length === 0 ? '📦' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {foods.length === 0 ? 'No Foods in Database' : 'No Matching Foods'}
          </h3>
          <p className="text-gray-600">
            {foods.length === 0
              ? 'The food database is empty. Submit a food to get started.'
              : 'No foods match your current filters. Try adjusting your search or filters.'}
          </p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredFoods.length} of {foods.length} foods
          </p>
          <div key={animationKey} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoods.map((food, index) => (
              <div
                key={food.id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <FoodCard
                  food={food}
                  onClick={() => setSelectedFood(food)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {selectedFood && (
        <SimpleFoodDetailModal
          isOpen={!!selectedFood}
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </>
  );
}
