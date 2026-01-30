'use client';

import { HealthCondition } from '@/types';
import { HEALTH_CONDITIONS } from '@/lib/constants';

interface HealthConditionsSelectProps {
  value: HealthCondition[];
  onChange: (conditions: HealthCondition[]) => void;
}

export default function HealthConditionsSelect({
  value,
  onChange,
}: HealthConditionsSelectProps) {
  const handleToggle = (condition: HealthCondition) => {
    if (value.includes(condition)) {
      onChange(value.filter((c) => c !== condition));
    } else {
      onChange([...value, condition]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Health Conditions
        <span className="text-gray-400 font-normal ml-1">(optional)</span>
      </label>
      <p className="text-xs text-gray-500 -mt-1">
        Select any health conditions to filter food recommendations
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {HEALTH_CONDITIONS.map((condition) => (
          <label
            key={condition.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${
                value.includes(condition.value as HealthCondition)
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="checkbox"
              checked={value.includes(condition.value as HealthCondition)}
              onChange={() => handleToggle(condition.value as HealthCondition)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-gray-900">
                {condition.label}
              </span>
              <span className="block text-xs text-gray-500 truncate">
                {condition.description}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
