/**
 * Utility functions for interacting with Supabase database
 */
import { createClient } from './server';

/**
 * Get poll results with vote counts for each option.
 * Calls Supabase RPC function 'get_poll_results'.
 * @param pollId - The ID of the poll
 * @returns Array of option indexes and their vote counts
 */
export async function getPollResults(pollId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('get_poll_results', { poll_id: pollId });
  
  if (error) {
    console.error('Error fetching poll results:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Check if a user has already voted on a poll.
 * Calls Supabase RPC function 'has_user_voted'.
 * @param pollId - The ID of the poll
 * @param userId - The ID of the user
 * @returns Boolean indicating if the user has voted
 */
export async function hasUserVoted(pollId: string, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('has_user_voted', { 
      poll_id: pollId,
      user_id: userId 
    });
  
  if (error) {
    console.error('Error checking if user voted:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Get total votes for a poll.
 * Counts rows in the 'votes' table for the given poll.
 * @param pollId - The ID of the poll
 * @returns Number of total votes
 */
export async function getTotalVotes(pollId: string) {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId);
  
  if (error) {
    console.error('Error counting votes:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get all polls with their vote counts.
 * Fetches all polls and appends totalVotes for each.
 * @returns Array of polls with vote counts
 */
export async function getPollsWithVoteCounts() {
  const supabase = await createClient();
  
  // First get all polls
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (pollsError || !polls) {
    console.error('Error fetching polls:', pollsError);
    return [];
  }
  
  // Then get vote counts for each poll
  const pollsWithVotes = await Promise.all(
    polls.map(async (poll) => {
      const totalVotes = await getTotalVotes(poll.id);
      return {
        ...poll,
        totalVotes
      };
    })
  );
  
  return pollsWithVotes;
}