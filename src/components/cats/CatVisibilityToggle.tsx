'use client';

interface CatVisibilityToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export default function CatVisibilityToggle({
  isPublic,
  onChange,
}: CatVisibilityToggleProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Community Profile
      </label>

      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => onChange(!isPublic)}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            ${isPublic ? 'bg-orange-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${isPublic ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {isPublic ? 'Public Profile' : 'Private Profile'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isPublic
              ? 'Other users can see this cat in the community, follow them, and see meal plans they share.'
              : 'This cat is only visible to you. Enable public profile to share meal plans with the community.'}
          </p>
        </div>
      </div>

      {isPublic && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-orange-800">
          <p className="font-medium mb-1">What&apos;s shared publicly:</p>
          <ul className="list-disc list-inside space-y-0.5 text-orange-700">
            <li>Cat&apos;s name and profile photo</li>
            <li>Bio (if provided)</li>
            <li>Meal plans you choose to share</li>
          </ul>
          <p className="mt-2 text-xs text-orange-600">
            Your personal account information is never shared.
          </p>
        </div>
      )}
    </div>
  );
}
