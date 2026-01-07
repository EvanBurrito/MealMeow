import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <Card variant="elevated" className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check Your Email
        </h1>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent you a verification link. Please check your email and click
          the link to activate your account.
        </p>
        <Link href="/auth/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </Card>
    </div>
  );
}
