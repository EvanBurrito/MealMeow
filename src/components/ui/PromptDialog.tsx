'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  minLength?: number;
  isLoading?: boolean;
}

export default function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  required = false,
  minLength = 0,
  isLoading = false,
}: PromptDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = value.trim();

    if (required && !trimmed) {
      setError('This field is required');
      return;
    }

    if (minLength > 0 && trimmed.length < minLength) {
      setError(`Please enter at least ${minLength} characters`);
      return;
    }

    onSubmit(trimmed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-4">
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={4}
            className={`w-full px-3 py-2 border-2 rounded-lg resize-none outline-none transition-colors ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 focus:border-orange-500'
            }`}
            autoFocus
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
