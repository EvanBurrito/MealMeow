'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface InlineBioEditorProps {
  catId: string;
  initialBio: string | null;
  isPublic: boolean;
}

const MAX_BIO_LENGTH = 200;

export default function InlineBioEditor({
  catId,
  initialBio,
  isPublic,
}: InlineBioEditorProps) {
  const [bio, setBio] = useState(initialBio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(initialBio || '');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    const trimmedBio = editedBio.trim();
    const previousBio = bio;

    // Optimistic update
    setBio(trimmedBio);
    setIsEditing(false);

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('cats')
          .update({ bio: trimmedBio || null })
          .eq('id', catId);

        if (error) throw error;
        router.refresh();
      } catch (err) {
        console.error('Error saving bio:', err);
        setBio(previousBio);
        setIsEditing(true);
      }
    });
  };

  const handleCancel = () => {
    setEditedBio(bio);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditedBio(bio);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="relative">
          <textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
            placeholder="Add a bio for your cat..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-700"
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            autoFocus
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {editedBio.length}/{MAX_BIO_LENGTH}
          </div>
        </div>

        {!isPublic && (
          <p className="text-xs text-gray-500 mt-1">
            Bio will be visible when profile is made public
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isPending}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 group">
      {bio ? (
        <div className="flex items-start gap-2">
          <p className="text-gray-700 flex-1">{bio}</p>
          <button
            onClick={handleStartEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Edit bio"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={handleStartEdit}
          className="text-gray-400 hover:text-gray-600 text-sm italic flex items-center gap-1"
        >
          <span>Add a bio...</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {!isPublic && bio && (
        <p className="text-xs text-gray-400 mt-1">
          Bio will be visible when profile is made public
        </p>
      )}
    </div>
  );
}
