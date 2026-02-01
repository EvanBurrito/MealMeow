import Card from '@/components/ui/Card';

export default function CommunityPostsPage() {
  return (
    <Card variant="bordered" hover={false} className="text-center py-16">
      <div className="text-6xl mb-4">🐱</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        The social feed where cats share their favorite foods, milestones, and
        connect with other feline friends is coming soon. Stay tuned!
      </p>
    </Card>
  );
}
