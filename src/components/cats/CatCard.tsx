import Link from 'next/link';
import { Cat } from '@/types';
import { formatAge } from '@/lib/nutrition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const genderEmoji = cat.gender === 'male' ? '♂️' : '♀️';
  const neuteredStatus = cat.is_neutered ? '(Fixed)' : '(Intact)';

  return (
    <Card variant="bordered" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🐱</div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{cat.name}</h3>
            <p className="text-gray-600">{cat.breed}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Age:</span>
          <span className="font-medium">{formatAge(cat.age_months)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Weight:</span>
          <span className="font-medium">{cat.weight_lbs} lbs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Gender:</span>
          <span className="font-medium">
            {genderEmoji} {cat.gender} {neuteredStatus}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Activity:</span>
          <span className="font-medium capitalize">{cat.activity_level}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/cats/${cat.id}/recommendations`} className="flex-1">
          <Button className="w-full">Get Food Plan</Button>
        </Link>
        <Link href={`/cats/${cat.id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>
    </Card>
  );
}
