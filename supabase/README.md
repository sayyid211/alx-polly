# Supabase Schema for ALX Polly

This directory contains the database schema for the ALX Polly application. The schema defines the structure of the database tables, relationships, policies, functions, and triggers used by the application.

## Database Structure

### Tables

1. **profiles** - Extends the Supabase auth.users table with additional user information
   - `id`: UUID (Primary Key, references auth.users)
   - `name`: TEXT
   - `avatar_url`: TEXT
   - `created_at`: TIMESTAMP WITH TIME ZONE
   - `updated_at`: TIMESTAMP WITH TIME ZONE

2. **polls** - Stores poll information
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key to auth.users)
   - `question`: TEXT
   - `options`: TEXT[] (Array of poll options)
   - `created_at`: TIMESTAMP WITH TIME ZONE
   - `updated_at`: TIMESTAMP WITH TIME ZONE

3. **votes** - Stores vote information
   - `id`: UUID (Primary Key)
   - `poll_id`: UUID (Foreign Key to polls)
   - `user_id`: UUID (Foreign Key to auth.users, nullable for anonymous votes)
   - `option_index`: INTEGER (Index of the selected option in the polls.options array)
   - `created_at`: TIMESTAMP WITH TIME ZONE

### Row Level Security (RLS) Policies

The schema implements Row Level Security to ensure data access control:

- **profiles**: Users can only view and update their own profiles
- **polls**: 
  - Anyone can view polls
  - Users can only create, update, and delete their own polls
- **votes**:
  - Anyone can view votes
  - Users can insert votes (either authenticated or anonymous)

### Functions

1. **get_poll_results(poll_id UUID)** - Returns the count of votes for each option in a poll
2. **has_user_voted(poll_id UUID, user_id UUID)** - Checks if a user has already voted on a poll
3. **update_updated_at()** - Trigger function to automatically update the updated_at field

### Triggers

1. **update_profiles_updated_at** - Updates the updated_at field when a profile is updated
2. **update_polls_updated_at** - Updates the updated_at field when a poll is updated

### Indexes

The schema creates indexes for better query performance:

- `polls_user_id_idx` on polls.user_id
- `votes_poll_id_idx` on votes.poll_id
- `votes_user_id_idx` on votes.user_id

## How to Use

### Setting Up the Schema

To apply this schema to your Supabase project:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Paste into the SQL Editor and run the script

### Using with the Application

The ALX Polly application is already configured to work with this schema. The Supabase client is set up in:

- `/lib/supabase/server.ts` - For server-side operations
- `/lib/supabase/client.ts` - For client-side operations

### Environment Variables

Make sure your `.env.local` file contains the necessary Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-service-role-key
```

## Security Considerations

- The schema implements Row Level Security to protect data access
- Anonymous voting is supported, but can be restricted by modifying the votes policy
- Consider adding rate limiting for vote submissions to prevent abuse
- Review the JWT secret configuration for your production environment