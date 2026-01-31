'use client';

interface NutritionComparisonBarProps {
  targetKcal: number;
  providedKcal: number;
  label?: string;
}

export default function NutritionComparisonBar({
  targetKcal,
  providedKcal,
  label = 'Daily Calories',
}: NutritionComparisonBarProps) {
  const difference = providedKcal - targetKcal;
  const percentDifference = (difference / targetKcal) * 100;
  const percentFilled = Math.min(100, (providedKcal / targetKcal) * 100);

  // Determine color based on how close to target
  const getBarColor = () => {
    const absDiff = Math.abs(percentDifference);
    if (absDiff <= 5) return 'bg-green-500';
    if (absDiff <= 10) return 'bg-yellow-500';
    if (percentDifference > 0) return 'bg-orange-500';
    return 'bg-red-400';
  };

  const getDifferenceColor = () => {
    const absDiff = Math.abs(percentDifference);
    if (absDiff <= 5) return 'text-green-600';
    if (absDiff <= 10) return 'text-yellow-600';
    if (percentDifference > 0) return 'text-orange-600';
    return 'text-red-500';
  };

  const formatDifference = () => {
    if (Math.abs(difference) < 5) return 'On target';
    const sign = difference > 0 ? '+' : '';
    return `${sign}${Math.round(difference)} kcal (${sign}${Math.round(percentDifference)}%)`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${getDifferenceColor()}`}>
          {formatDifference()}
        </span>
      </div>

      <div className="relative">
        {/* Background bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* Filled portion */}
          <div
            className={`h-full ${getBarColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${percentFilled}%` }}
          />
        </div>

        {/* Target marker */}
        <div
          className="absolute top-0 w-0.5 h-3 bg-gray-900"
          style={{ left: '100%', transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{providedKcal} kcal provided</span>
        <span>{targetKcal} kcal needed</span>
      </div>
    </div>
  );
}
