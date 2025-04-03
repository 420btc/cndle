-- Create bet history table
CREATE TABLE public.bet_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('bull', 'bear')),
  result TEXT NOT NULL CHECK (result IN ('ganó', 'perdió', 'pendiente')),
  amount INTEGER NOT NULL,
  minute INTEGER NOT NULL,
  initial_price DECIMAL(20, 8),
  final_price DECIMAL(20, 8),
  game_type TEXT NOT NULL CHECK (game_type IN ('1min', '5min')),
  is_double_bet BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.bet_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own bet history
CREATE POLICY "Users can read their own bet history" 
  ON public.bet_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert into their own bet history
CREATE POLICY "Users can insert into their own bet history" 
  ON public.bet_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own bet history
CREATE POLICY "Users can update their own bet history" 
  ON public.bet_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX bet_history_user_id_idx ON public.bet_history (user_id);

-- Create index on result for faster filtering
CREATE INDEX bet_history_result_idx ON public.bet_history (result);

-- Create index on game_type for faster filtering
CREATE INDEX bet_history_game_type_idx ON public.bet_history (game_type);
