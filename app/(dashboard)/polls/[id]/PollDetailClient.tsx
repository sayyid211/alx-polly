'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitVote } from '@/app/lib/actions/poll-actions';
import { getPollResults, hasUserVoted } from '@/lib/supabase/database';
import { useAuth } from '@/app/lib/context/auth-context';
import { deletePoll } from '@/app/lib/actions/poll-actions';
import { useRouter } from 'next/navigation';

interface Poll {
  id: string;
  question: string;
  options: string[];
  user_id: string;
  created_at: string;
}

interface PollResults {
  option_index: number;
  count: number;
}

interface PollDetailClientProps {
  poll: Poll;
}

export default function PollDetailClient({ poll }: PollDetailClientProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<PollResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch poll results
        const pollResults = await getPollResults(poll.id);
        setResults(pollResults);

        // Check if user has voted (only if authenticated)
        if (user) {
          const userHasVoted = await hasUserVoted(poll.id, user.id);
          setHasVoted(userHasVoted);
        }
      } catch (err) {
        setError('Failed to load poll data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poll.id, user]);

  const handleVote = async () => {
    if (selectedOption === null) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await submitVote(poll.id, selectedOption);
      
      if (result?.error) {
        setError(result.error);
      } else {
        setHasVoted(true);
        // Refresh results
        const updatedResults = await getPollResults(poll.id);
        setResults(updatedResults);
      }
    } catch (err) {
      setError('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this poll?')) {
      const result = await deletePoll(poll.id);
      if (!result?.error) {
        router.push('/polls');
      }
    }
  };

  const getTotalVotes = () => {
    return results.reduce((sum, result) => sum + result.count, 0);
  };

  const getVotesForOption = (optionIndex: number) => {
    const result = results.find(r => r.option_index === optionIndex);
    return result ? result.count : 0;
  };

  const getPercentage = (votes: number) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const isOwner = user && user.id === poll.user_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading poll...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {isOwner && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${poll.id}/edit`}>Edit Poll</Link>
            </Button>
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedOption === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button 
                onClick={handleVote} 
                disabled={selectedOption === null || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option, index) => {
                const votes = getVotesForOption(index);
                const percentage = getPercentage(votes);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option}</span>
                      <span>{percentage}% ({votes} votes)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {getTotalVotes()}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            Copy Link
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              const text = encodeURIComponent(`Check out this poll: ${poll.question}`);
              const url = encodeURIComponent(window.location.href);
              window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
            }}
          >
            Share on Twitter
          </Button>
        </div>
      </div>
    </>
  );
}