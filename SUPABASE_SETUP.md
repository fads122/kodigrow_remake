# Supabase Setup Instructions

## Environment Variables

Create a `.env.local` file in the root of your `kodigrow` directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://auuwlmissouxrhmcqzgd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jnu9KFO38eD63BV2191aEA_9OWlsROz
SUPABASE_SERVICE_ROLE_KEY=sb_secret_BN-ggmVUGsXuMg2Fw3fz6w_b_xPtJSw
```

**Important Security Notes:**
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - This is the **anon/publishable key** (safe for browser use)
- `SUPABASE_SERVICE_ROLE_KEY` - This is the **secret key** (NEVER expose in browser, only use server-side)
- Keys starting with `sb_publishable_` are safe for client-side use
- Keys starting with `sb_secret_` should NEVER be in `NEXT_PUBLIC_` variables

## Database Setup

### Step 1: Run SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase_schema.sql`
6. Click **Run** to execute the SQL

This will create:
- `profiles` table that extends auth.users
- Row Level Security (RLS) policies
- Automatic profile creation trigger
- Indexes for performance

### Step 2: Enable Email Authentication

1. Go to **Authentication** > **Settings**
2. Enable **Enable email signup**
3. Configure email confirmations (optional):
   - If you want instant signup: Disable "Enable email confirmations"
   - If you want email verification: Enable "Enable email confirmations"

## User Metadata

The signup form automatically stores:
- `full_name` - User's full name
- `account_type` - Either "student" or "professor"

This data is:
1. Stored in `user_metadata` during signup
2. Automatically copied to `profiles` table via trigger
3. Accessible via `profiles` table for queries

## Testing

1. Run `npm install` to ensure @supabase/supabase-js is installed
2. Create the `.env.local` file with your credentials
3. Run the SQL schema in Supabase Dashboard
4. Restart your dev server: `npm run dev`
5. Try signing up with a new account

## Querying Users

You can query user profiles like this:

```typescript
// Get all students
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('account_type', 'student');

// Get current user's profile
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user?.id)
  .single();
```
