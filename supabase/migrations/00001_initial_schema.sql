-- Migration: 00001_initial_schema
-- Description: Initial schema setup for ALX Polly application
-- Created at: 2023-07-01 12:00:00

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tables

-- Profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Polls policies
CREATE POLICY "Polls are viewable by everyone" 
  ON polls FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own polls" 
  ON polls FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" 
  ON votes FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own votes" 
  ON votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create functions

-- Function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_id UUID)
RETURNS TABLE (option_index INTEGER, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.option_index, COUNT(*) as count
  FROM votes v
  WHERE v.poll_id = get_poll_results.poll_id
  GROUP BY v.option_index
  ORDER BY v.option_index;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION has_user_voted(poll_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM votes v 
    WHERE v.poll_id = has_user_voted.poll_id 
    AND v.user_id = has_user_voted.user_id
  ) INTO vote_exists;
  
  RETURN vote_exists;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS polls_user_id_idx ON polls (user_id);
CREATE INDEX IF NOT EXISTS votes_poll_id_idx ON votes (poll_id);
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON votes (user_id);