import { redirect } from 'next/navigation';

interface PublicCatPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicCatPage({ params }: PublicCatPageProps) {
  const { id } = await params;
  redirect(`/cats/${id}`);
}
