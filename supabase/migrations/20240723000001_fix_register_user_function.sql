-- Drop and recreate the register_user function with correct parameter handling
DROP FUNCTION IF EXISTS custom_auth.register_user(text, text);

CREATE OR REPLACE FUNCTION custom_auth.register_user(
  username TEXT,
  password TEXT
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM custom_auth.users WHERE users.username = register_user.username) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  -- Insert the new user
  INSERT INTO custom_auth.users (username, password)
  VALUES (register_user.username, custom_auth.hash_password(register_user.password))
  RETURNING id INTO user_id;
  
  -- Also create a profile for the user
  INSERT INTO public.user_profiles (id, coins, lives)
  VALUES (user_id, 100, 3);
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the login_user function with correct parameter handling
DROP FUNCTION IF EXISTS custom_auth.login_user(text, text);

CREATE OR REPLACE FUNCTION custom_auth.login_user(
  username TEXT,
  password TEXT
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM custom_auth.users
  WHERE 
    custom_auth.users.username = login_user.username
    AND custom_auth.users.password = crypt(login_user.password, custom_auth.users.password);
    
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
