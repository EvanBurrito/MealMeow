'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Cat, Gender, ActivityLevel, Goal, HealthCondition } from '@/types';
import { CAT_BREEDS, ACTIVITY_LEVELS, GOALS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/ui/ImageUpload';
import HealthConditionsSelect from '@/components/cats/HealthConditionsSelect';

interface CatFormProps {
  cat?: Cat;
  mode: 'create' | 'edit';
}

export default function CatForm({ cat, mode }: CatFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    cat?.profile_image_url || null
  );

  const [formData, setFormData] = useState({
    name: cat?.name || '',
    weight_lbs: cat?.weight_lbs?.toString() || '',
    age_years: cat ? Math.floor(cat.age_months / 12).toString() : '',
    age_months: cat ? (cat.age_months % 12).toString() : '',
    gender: cat?.gender || 'male',
    is_neutered: cat?.is_neutered ?? true,
    breed: cat?.breed || 'Domestic Shorthair',
    activity_level: cat?.activity_level || 'normal',
    goal: cat?.goal || 'maintain',
    health_conditions: cat?.health_conditions || [] as HealthCondition[],
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase.auth]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ageMonths =
        parseInt(formData.age_years || '0') * 12 +
        parseInt(formData.age_months || '0');

      const catData = {
        name: formData.name,
        weight_lbs: parseFloat(formData.weight_lbs),
        age_months: ageMonths,
        gender: formData.gender as Gender,
        is_neutered: formData.is_neutered,
        breed: formData.breed,
        activity_level: formData.activity_level as ActivityLevel,
        goal: formData.goal as Goal,
        health_conditions: formData.health_conditions,
        profile_image_url: profileImageUrl,
        user_id: user.id,
      };

      if (mode === 'create') {
        const { error } = await supabase.from('cats').insert(catData);
        if (error) throw error;
      } else if (cat) {
        const { error } = await supabase
          .from('cats')
          .update(catData)
          .eq('id', cat.id);
        if (error) throw error;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error creating cat:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const breedOptions = CAT_BREEDS.map((breed) => ({
    value: breed,
    label: breed,
  }));

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'create' ? 'Add New Cat' : 'Edit Cat Profile'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload */}
        {userId && (
          <div className="flex justify-center">
            <ImageUpload
              currentImageUrl={profileImageUrl}
              onImageUploaded={setProfileImageUrl}
              userId={userId}
              catId={cat?.id}
            />
          </div>
        )}

        <Input
          label="Cat's Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Whiskers"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Weight (lbs)"
            name="weight_lbs"
            value={formData.weight_lbs}
            onChange={handleChange}
            placeholder="10"
            min="1"
            max="50"
            step="0.1"
            required
          />

          <Select
            label="Breed"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            options={breedOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Age (Years)"
            name="age_years"
            value={formData.age_years}
            onChange={handleChange}
            placeholder="2"
            min="0"
            max="25"
          />
          <Input
            type="number"
            label="Age (Months)"
            name="age_months"
            value={formData.age_months}
            onChange={handleChange}
            placeholder="6"
            min="0"
            max="11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_neutered"
                checked={formData.is_neutered}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Spayed/Neutered
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Activity Level"
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            options={ACTIVITY_LEVELS.map((a) => ({
              value: a.value,
              label: a.label,
            }))}
          />

          <Select
            label="Weight Goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            options={GOALS.map((g) => ({ value: g.value, label: g.label }))}
          />
        </div>

        <HealthConditionsSelect
          value={formData.health_conditions}
          onChange={(conditions) =>
            setFormData((prev) => ({ ...prev, health_conditions: conditions }))
          }
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {mode === 'create' ? 'Add Cat' : 'Save Changes'}
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
