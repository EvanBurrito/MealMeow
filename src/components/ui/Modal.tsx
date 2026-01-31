'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-xl',
};

export default function Modal({ isOpen, onClose, size = 'md', children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Opening: first mount the component, then animate in after a frame
      setShouldRender(true);
      // Small delay ensures browser paints the initial opacity-0 state first
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else if (shouldRender) {
      // Closing: animate out first, then unmount
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleEscKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (shouldRender) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [shouldRender, handleEscKey]);

  // Handle backdrop click - close only when clicking the backdrop itself
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop directly, not the dialog
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender || !mounted) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isAnimatingIn ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        className={`relative z-10 bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transition-all duration-200 ${
          isAnimatingIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  // This ensures fixed positioning works regardless of parent transforms
  return createPortal(modalContent, document.body);
}
