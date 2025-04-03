-- Create active bets table
CREATE TABLE public.active_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('bull', 'bear')),
  amount INTEGER NOT NULL,
  candle_timestamp BIGINT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('1min', '5min')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  won BOOLEAN,
  initial_price DECIMAL(20, 8),
  final_price DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_double_bet BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.active_bets ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own bets
CREATE POLICY "Users can read their own bets" 
  ON public.active_bets 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own bets
CREATE POLICY "Users can insert their own bets" 
  ON public.active_bets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own bets
CREATE POLICY "Users can update their own bets" 
  ON public.active_bets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX active_bets_user_id_idx ON public.active_bets (user_id);

-- Create index on resolved status for faster filtering
CREATE INDEX active_bets_resolved_idx ON public.active_bets (resolved);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_active_bets_updated_at
  BEFORE UPDATE ON public.active_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
