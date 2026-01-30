'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserSubmittedFood, SubmissionStatus } from '@/types';
import Header from '@/components/layout/Header';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const STATUS_TABS: { value: SubmissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'needs_revision', label: 'Needs Revision' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<UserSubmittedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!profile?.is_admin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);

        // Load all submissions
        const { data, error } = await supabase
          .from('user_submitted_foods')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);
      } catch (err: unknown) {
        console.error('Error loading submissions:', err);
        setError('Failed to load submissions');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  const filteredSubmissions =
    activeTab === 'all'
      ? submissions
      : submissions.filter((s) => s.status === activeTab);

  const handleStatusUpdate = async (
    submission: UserSubmittedFood,
    newStatus: SubmissionStatus,
    adminNotes?: string
  ) => {
    setProcessingId(submission.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updateData: Record<string, unknown> = {
        status: newStatus,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      // If approving, also add to cat_foods table
      if (newStatus === 'approved') {
        const foodData = {
          brand: submission.brand,
          product_name: submission.product_name,
          food_type: submission.food_type,
          life_stage: submission.life_stage,
          kcal_per_cup: submission.kcal_per_cup,
          kcal_per_can: submission.kcal_per_can,
          can_size_oz: submission.can_size_oz,
          price_per_unit: submission.price_per_unit,
          unit_size: submission.unit_size,
          servings_per_unit: submission.servings_per_unit,
          protein_pct: submission.protein_pct,
          fat_pct: submission.fat_pct,
          fiber_pct: submission.fiber_pct,
          moisture_pct: submission.moisture_pct,
          special_benefits: submission.special_benefits,
          is_complete_balanced: submission.is_complete_balanced,
          image_url: submission.image_url,
        };

        const { data: newFood, error: foodError } = await supabase
          .from('cat_foods')
          .insert(foodData)
          .select()
          .single();

        if (foodError) throw foodError;

        updateData.approved_food_id = newFood.id;
      }

      const { error: updateError } = await supabase
        .from('user_submitted_foods')
        .update(updateData)
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? {
                ...s,
                status: newStatus,
                admin_notes: adminNotes ?? s.admin_notes,
                reviewed_at: new Date().toISOString(),
              }
            : s
        )
      );
    } catch (err) {
      console.error('Error updating submission:', err);
      alert('Failed to update submission');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (submission: UserSubmittedFood) => {
    if (confirm('Approve this submission and add it to the food database?')) {
      handleStatusUpdate(submission, 'approved');
    }
  };

  const handleReject = (submission: UserSubmittedFood) => {
    const notes = prompt('Reason for rejection (visible to user):');
    if (notes !== null) {
      handleStatusUpdate(submission, 'rejected', notes);
    }
  };

  const handleRequestRevision = (submission: UserSubmittedFood) => {
    const notes = prompt('What changes are needed? (visible to user):');
    if (notes !== null && notes.trim()) {
      handleStatusUpdate(submission, 'needs_revision', notes);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🐱</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminLayout>
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Food Submissions</h1>
              <p className="text-gray-600 mt-1">Review and approve user-submitted food products</p>
            </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? submissions.length
                : submissions.filter((s) => s.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {error && (
          <Card variant="bordered" className="text-center py-8 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {filteredSubmissions.length === 0 && !error && (
          <Card variant="bordered" className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'pending' ? '🎉' : '📭'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'pending' ? 'All Caught Up!' : 'No Submissions'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending'
                ? 'There are no pending submissions to review.'
                : `No submissions with status "${activeTab}".`}
            </p>
          </Card>
        )}

        {filteredSubmissions.length > 0 && (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} variant="bordered" className="animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.product_name}
                        </h3>
                        <p className="text-gray-600">{submission.brand}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          submission.food_type === 'dry'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {submission.food_type === 'dry' ? 'Dry' : 'Wet'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-1 font-medium">
                          ${submission.price_per_unit.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit:</span>
                        <span className="ml-1 font-medium">{submission.unit_size}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Protein:</span>
                        <span className="ml-1 font-medium">{submission.protein_pct}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fat:</span>
                        <span className="ml-1 font-medium">{submission.fat_pct}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fiber:</span>
                        <span className="ml-1 font-medium">{submission.fiber_pct}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Moisture:</span>
                        <span className="ml-1 font-medium">{submission.moisture_pct}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Calories:</span>
                        <span className="ml-1 font-medium">
                          {submission.food_type === 'dry'
                            ? `${submission.kcal_per_cup} kcal/cup`
                            : `${submission.kcal_per_can} kcal/can`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Life Stage:</span>
                        <span className="ml-1 font-medium capitalize">{submission.life_stage}</span>
                      </div>
                    </div>

                    {/* Special Benefits */}
                    {submission.special_benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {submission.special_benefits.map((benefit) => (
                          <span
                            key={benefit}
                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Source URL */}
                    {submission.source_url && (
                      <div className="mt-3">
                        <a
                          href={submission.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 hover:text-orange-700"
                        >
                          View Product Page
                        </a>
                      </div>
                    )}

                    {/* User Notes */}
                    {submission.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-500">User notes:</span>
                        <span className="ml-1 text-gray-700">{submission.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {submission.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2 lg:w-32">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(submission)}
                        isLoading={processingId === submission.id}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestRevision(submission)}
                        disabled={processingId === submission.id}
                        className="flex-1"
                      >
                        Request Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(submission)}
                        disabled={processingId === submission.id}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {submission.status !== 'pending' && (
                    <div className="lg:w-32 text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          submission.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {submission.status === 'needs_revision'
                          ? 'Needs Revision'
                          : submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
          </div>
        </AdminLayout>
      </div>
    </div>
  );
}
