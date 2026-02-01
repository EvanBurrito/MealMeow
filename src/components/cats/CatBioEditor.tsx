'use client';

import { useState, useEffect } from 'react';

interface CatBioEditorProps {
  bio: string;
  onChange: (bio: string) => void;
  maxLength?: number;
}

export default function CatBioEditor({
  bio,
  onChange,
  maxLength = 200,
}: CatBioEditorProps) {
  const [localBio, setLocalBio] = useState(bio);

  useEffect(() => {
    setLocalBio(bio);
  }, [bio]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setLocalBio(value);
      onChange(value);
    }
  };

  const remainingChars = maxLength - localBio.length;
  const isNearLimit = remainingChars <= 20;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Bio <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      <textarea
        value={localBio}
        onChange={handleChange}
        placeholder="Tell the community about your cat... (e.g., Indoor tabby who loves chicken flavors!)"
        rows={3}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-colors text-sm"
      />

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          This bio will be visible on your cat&apos;s public profile.
        </p>
        <span
          className={`text-xs ${
            isNearLimit
              ? remainingChars <= 0
                ? 'text-red-500'
                : 'text-orange-500'
              : 'text-gray-400'
          }`}
        >
          {remainingChars} characters left
        </span>
      </div>
    </div>
  );
}
