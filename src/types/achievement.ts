export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: AchievementType;
  reward?: {
    coins?: number;
    luckyBonus?: boolean;
  };
  unlocked: boolean;
  progress: number;
}

export type AchievementType = 
  | 'streak' 
  | 'wins' 
  | 'bets' 
  | 'coins' 
  | 'level'
  | 'bull_wins'
  | 'bear_wins'
  | 'wheel_spins'
  | 'daily_login'
  | 'pattern_recognition'
  | 'perfect_day'
  | 'comeback'
  | 'accuracy'
  | 'time_played'
  | 'no_loss_streak';
