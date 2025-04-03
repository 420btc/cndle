-- Fix RLS policies for custom_auth.users
DROP POLICY IF EXISTS "Users can read their own data" ON custom_auth.users;
DROP POLICY IF EXISTS "Users can update their own data" ON custom_auth.users;

-- Create policy for anyone to read users (needed for login)
CREATE POLICY "Anyone can read users"
ON custom_auth.users
FOR SELECT
USING (true);

-- Create policy for anyone to insert users (needed for registration)
CREATE POLICY "Anyone can insert users"
ON custom_auth.users
FOR INSERT
WITH CHECK (true);

-- Fix RLS policies for user_profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to read user_profiles
CREATE POLICY "Anyone can read user_profiles"
ON public.user_profiles
FOR SELECT
USING (true);

-- Create policy for anyone to insert user_profiles
CREATE POLICY "Anyone can insert user_profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (true);

-- Create policy for anyone to update user_profiles
CREATE POLICY "Anyone can update user_profiles"
ON public.user_profiles
FOR UPDATE
USING (true);

-- Fix RLS policies for active_bets
ALTER TABLE public.active_bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_bets ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to read active_bets
CREATE POLICY "Anyone can read active_bets"
ON public.active_bets
FOR SELECT
USING (true);

-- Create policy for anyone to insert active_bets
CREATE POLICY "Anyone can insert active_bets"
ON public.active_bets
FOR INSERT
WITH CHECK (true);

-- Create policy for anyone to update active_bets
CREATE POLICY "Anyone can update active_bets"
ON public.active_bets
FOR UPDATE
USING (true);

-- Fix RLS policies for bet_history
ALTER TABLE public.bet_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to read bet_history
CREATE POLICY "Anyone can read bet_history"
ON public.bet_history
FOR SELECT
USING (true);

-- Create policy for anyone to insert bet_history
CREATE POLICY "Anyone can insert bet_history"
ON public.bet_history
FOR INSERT
WITH CHECK (true);

-- Create policy for anyone to update bet_history
CREATE POLICY "Anyone can update bet_history"
ON public.bet_history
FOR UPDATE
USING (true);
