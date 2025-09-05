-- Seed data for ALX Polly application
-- This script populates the database with test data for development purposes

-- Insert test profiles
-- Note: These will only work if the corresponding users exist in auth.users
-- You'll need to create these users through Supabase Auth first
INSERT INTO profiles (id, name, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test User 1', 'https://i.pravatar.cc/150?u=test1'),
  ('00000000-0000-0000-0000-000000000002', 'Test User 2', 'https://i.pravatar.cc/150?u=test2'),
  ('00000000-0000-0000-0000-000000000003', 'Test User 3', 'https://i.pravatar.cc/150?u=test3')
ON CONFLICT (id) DO NOTHING;

-- Insert test polls
INSERT INTO polls (id, user_id, question, options)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'What is your favorite programming language?', ARRAY['JavaScript', 'Python', 'TypeScript', 'Java', 'C#']),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Which frontend framework do you prefer?', ARRAY['React', 'Vue', 'Angular', 'Svelte']),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'What is your preferred database?', ARRAY['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis']),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'How do you deploy your applications?', ARRAY['Vercel', 'Netlify', 'AWS', 'DigitalOcean', 'Self-hosted'])
ON CONFLICT (id) DO NOTHING;

-- Insert test votes
INSERT INTO votes (poll_id, user_id, option_index)
VALUES
  -- Votes for poll 1
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 0),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 1),
  ('10000000-0000-0000-0000-000000000001', NULL, 0),
  ('10000000-0000-0000-0000-000000000001', NULL, 2),
  ('10000000-0000-0000-0000-000000000001', NULL, 1),
  
  -- Votes for poll 2
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 0),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 0),
  ('10000000-0000-0000-0000-000000000002', NULL, 1),
  ('10000000-0000-0000-0000-000000000002', NULL, 3),
  
  -- Votes for poll 3
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 0),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 0),
  ('10000000-0000-0000-0000-000000000003', NULL, 2),
  ('10000000-0000-0000-0000-000000000003', NULL, 4),
  
  -- Votes for poll 4
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 0),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 1)
ON CONFLICT DO NOTHING;