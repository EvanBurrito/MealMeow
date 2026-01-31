'use client';

import { useMemo } from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export default function HighlightedText({
  text,
  highlight,
  className = '',
}: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!highlight.trim()) {
      return [{ text, isMatch: false }];
    }

    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
    const splitParts = text.split(regex);

    return splitParts
      .filter((part) => part.length > 0)
      .map((part) => ({
        text: part,
        isMatch: part.toLowerCase() === highlight.toLowerCase(),
      }));
  }, [text, highlight]);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark
            key={index}
            className="bg-transparent text-orange-600 font-semibold relative inline-block animate-highlight-pop"
          >
            <span className="relative z-10">{part.text}</span>
            <span className="absolute inset-0 bg-orange-100 rounded-sm -z-0 animate-highlight-bg" />
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
