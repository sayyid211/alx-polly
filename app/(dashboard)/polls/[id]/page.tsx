import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import PollDetailClient from './PollDetailClient';

export default async function PollDetailPage({ params }: { params: { id: string } }) {
  const { poll, error } = await getPollById(params.id);

  if (error || !poll) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PollDetailClient poll={poll} />
    </div>
  );
}