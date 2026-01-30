'use client';

import Link from 'next/link';
import { UserSubmittedFood, SubmissionStatus } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface SubmissionCardProps {
  submission: UserSubmittedFood;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<SubmissionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  needs_revision: { label: 'Needs Revision', color: 'text-orange-700', bgColor: 'bg-orange-100' },
};

export default function SubmissionCard({ submission, onDelete }: SubmissionCardProps) {
  const status = statusConfig[submission.status];
  const canEdit = submission.status === 'pending' || submission.status === 'needs_revision';
  const canDelete = submission.status === 'pending';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card variant="bordered" className="relative">
      {/* Status Badge */}
      <div
        className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}
      >
        {status.label}
      </div>

      <div className="pt-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{submission.product_name}</h3>
            <p className="text-gray-600">{submission.brand}</p>
          </div>
          <span
            className={`px-2 py-1 rounded text-sm font-medium flex-shrink-0 ${
              submission.food_type === 'dry'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {submission.food_type === 'dry' ? 'Dry' : 'Wet'}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-2 font-medium">${submission.price_per_unit.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-500">Unit:</span>
            <span className="ml-2 font-medium">{submission.unit_size}</span>
          </div>
          <div>
            <span className="text-gray-500">Protein:</span>
            <span className="ml-2 font-medium">{submission.protein_pct}%</span>
          </div>
          <div>
            <span className="text-gray-500">Fat:</span>
            <span className="ml-2 font-medium">{submission.fat_pct}%</span>
          </div>
        </div>

        {/* Special Benefits */}
        {submission.special_benefits.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {submission.special_benefits.map((benefit) => (
              <span
                key={benefit}
                className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>
        )}

        {/* Admin Notes (if rejected or needs revision) */}
        {submission.admin_notes && (submission.status === 'rejected' || submission.status === 'needs_revision') && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Reviewer Notes:</p>
            <p className="text-sm text-gray-600">{submission.admin_notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Submitted {formatDate(submission.created_at)}
          </p>
          {(canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <Link href={`/foods/my-submissions/${submission.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(submission.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
