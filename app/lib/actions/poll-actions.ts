"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new poll for the authenticated user.
 * @param formData - FormData containing 'question' and 'options' fields
 * @returns An object with error message or null on success
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
    const options = formData.getAll("options").map(String).filter(Boolean);


  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieve all polls created by the authenticated user.
 * @returns An object with polls array and error message
 */
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Fetch a poll by its unique ID.
 * @param id - The poll ID
 * @returns An object with poll data and error message
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Submit a vote for a poll option.
 * Validates poll existence, option bounds, duplicate votes, and rate limiting for anonymous users.
 * @param pollId - The poll ID
 * @param optionIndex - The index of the selected option
 * @returns An object with error message or null on success
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Input validation
  if (!pollId || typeof pollId !== 'string') {
    return { error: 'Invalid poll ID' };
  }
  
  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: 'Invalid option selected' };
  }

  // Get poll to validate option index
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('options')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found' };
  }

  // Validate option index is within bounds
  if (optionIndex >= poll.options.length) {
    return { error: 'Invalid option selected' };
  }

  // Check for duplicate votes if user is authenticated
  if (user) {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      return { error: 'You have already voted on this poll' };
    }
  }

  // For anonymous users, implement basic rate limiting by checking recent votes from same session
  // This is a simple approach - in production, consider IP-based rate limiting
  if (!user) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .is('user_id', null)
      .gte('created_at', oneHourAgo);

    // Allow max 1 anonymous vote per poll per hour (basic rate limiting)
    if (recentVotes && recentVotes.length >= 1) {
      return { error: 'Too many anonymous votes. Please try again later or sign in.' };
    }
  }

  // Insert the vote
  const { error } = await supabase.from('votes').insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) {
    return { error: 'Failed to submit vote. Please try again.' };
  }

  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

/**
 * Delete a poll owned by the authenticated user.
 * Verifies ownership and poll existence before deletion.
 * @param id - The poll ID
 * @returns An object with error message or null on success
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Input validation
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid poll ID' };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: 'You must be logged in to delete a poll.' };
  }

  // Verify poll exists and user owns it before deletion
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('user_id')
    .eq('id', id)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found' };
  }

  if (poll.user_id !== user.id) {
    return { error: 'You can only delete your own polls' };
  }

  // Delete the poll (votes will be cascade deleted due to foreign key constraint)
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Double-check ownership in the delete query

  if (error) {
    return { error: 'Failed to delete poll. Please try again.' };
  }

  revalidatePath('/polls');
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Input validation
  if (!pollId || typeof pollId !== 'string') {
    return { error: 'Invalid poll ID' };
  }

  const question = formData.get("question") as string;
  const options = formData.getAll("options").map(String).filter(Boolean);

  // Sanitize and validate inputs
  const sanitizedQuestion = question?.trim();
  const sanitizedOptions = options.map(option => 
    typeof option === 'string' ? option.trim() : ''
  ).filter(option => option.length > 0);

  if (!sanitizedQuestion || sanitizedQuestion.length < 3) {
    return { error: "Question must be at least 3 characters long." };
  }

  if (sanitizedOptions.length < 2) {
    return { error: "Please provide at least two valid options." };
  }

  if (sanitizedOptions.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }

  // Check for duplicate options
  const uniqueOptions = [...new Set(sanitizedOptions)];
  if (uniqueOptions.length !== sanitizedOptions.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Verify poll exists and user owns it before updating
  const { data: existingPoll, error: pollError } = await supabase
    .from('polls')
    .select('user_id')
    .eq('id', pollId)
    .single();

  if (pollError || !existingPoll) {
    return { error: 'Poll not found' };
  }

  if (existingPoll.user_id !== user.id) {
    return { error: 'You can only update your own polls' };
  }

  // Update the poll
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: sanitizedQuestion, 
      options: sanitizedOptions 
    })
    .eq("id", pollId)
    .eq("user_id", user.id); // Double-check ownership

  if (error) {
    return { error: 'Failed to update poll. Please try again.' };
  }

  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}
