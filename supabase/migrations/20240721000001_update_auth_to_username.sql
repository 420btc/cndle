-- Create a custom auth schema for username-based authentication
CREATE SCHEMA IF NOT EXISTS custom_auth;

-- Create users table with username instead of email (no email column)
CREATE TABLE custom_auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION custom_auth.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION custom_auth.verify_password(username TEXT, password TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM custom_auth.users
  WHERE 
    custom_auth.users.username = verify_password.username
    AND custom_auth.users.password = crypt(verify_password.password, custom_auth.users.password);
    
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to register a new user
CREATE OR REPLACE FUNCTION custom_auth.register_user(username TEXT, password TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  INSERT INTO custom_auth.users (username, password)
  VALUES (username, custom_auth.hash_password(password))
  RETURNING id INTO user_id;
  
  -- Also create a profile for the user
  INSERT INTO public.user_profiles (id)
  VALUES (user_id);
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to login a user
CREATE OR REPLACE FUNCTION custom_auth.login_user(username TEXT, password TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT custom_auth.verify_password(username, password) INTO user_id;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the active_bets table to reference custom_auth.users
ALTER TABLE public.active_bets
DROP CONSTRAINT IF EXISTS active_bets_user_id_fkey,
ADD CONSTRAINT active_bets_user_id_fkey
FOREIGN KEY (user_id) REFERENCES custom_auth.users(id) ON DELETE CASCADE;

-- Update the bet_history table to reference custom_auth.users
ALTER TABLE public.bet_history
DROP CONSTRAINT IF EXISTS bet_history_user_id_fkey,
ADD CONSTRAINT bet_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES custom_auth.users(id) ON DELETE CASCADE;

-- Update the user_profiles table to reference custom_auth.users
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey,
ADD CONSTRAINT user_profiles_id_fkey
FOREIGN KEY (id) REFERENCES custom_auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for custom_auth.users
ALTER TABLE custom_auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read their own data"
ON custom_auth.users
FOR SELECT
USING (id = auth.uid());

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data"
ON custom_auth.users
FOR UPDATE
USING (id = auth.uid());

-- Create extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;
