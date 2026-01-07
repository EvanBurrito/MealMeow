import AuthForm from '@/components/auth/AuthForm';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <AuthForm mode="signup" />
    </div>
  );
}
