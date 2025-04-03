import { Achievement, AchievementType } from '../types/achievement';

export const achievements: Achievement[] = [
  // Streak achievements
  {
    id: 'streak_3',
    title: 'Winning Streak',
    description: 'Get a streak of 3 correct predictions',
    icon: 'flame',
    requirement: 3,
    type: 'streak',
    reward: { coins: 10 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_5',
    title: 'Hot Streak',
    description: 'Get a streak of 5 correct predictions',
    icon: 'flame',
    requirement: 5,
    type: 'streak',
    reward: { coins: 25 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_10',
    title: 'On Fire!',
    description: 'Get a streak of 10 correct predictions',
    icon: 'flame',
    requirement: 10,
    type: 'streak',
    reward: { coins: 100, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_15',
    title: 'Unstoppable',
    description: 'Get a streak of 15 correct predictions',
    icon: 'flame',
    requirement: 15,
    type: 'streak',
    reward: { coins: 200, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_20',
    title: 'Legendary Streak',
    description: 'Get a streak of 20 correct predictions',
    icon: 'flame',
    requirement: 20,
    type: 'streak',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'streak_25',
    title: 'Crypto Prophet',
    description: 'Get a streak of 25 correct predictions',
    icon: 'flame',
    requirement: 25,
    type: 'streak',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Wins achievements
  {
    id: 'wins_10',
    title: 'Beginner Trader',
    description: 'Win 10 bets',
    icon: 'trophy',
    requirement: 10,
    type: 'wins',
    reward: { coins: 20 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wins_50',
    title: 'Experienced Trader',
    description: 'Win 50 bets',
    icon: 'trophy',
    requirement: 50,
    type: 'wins',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wins_100',
    title: 'Professional Trader',
    description: 'Win 100 bets',
    icon: 'trophy',
    requirement: 100,
    type: 'wins',
    reward: { coins: 250 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wins_200',
    title: 'Expert Trader',
    description: 'Win 200 bets',
    icon: 'trophy',
    requirement: 200,
    type: 'wins',
    reward: { coins: 500 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wins_500',
    title: 'Master Trader',
    description: 'Win 500 bets',
    icon: 'trophy',
    requirement: 500,
    type: 'wins',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wins_1000',
    title: 'Trading Legend',
    description: 'Win 1000 bets',
    icon: 'trophy',
    requirement: 1000,
    type: 'wins',
    reward: { coins: 2500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Bets achievements
  {
    id: 'bets_50',
    title: 'Risk Taker',
    description: 'Place 50 bets',
    icon: 'cash',
    requirement: 50,
    type: 'bets',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bets_100',
    title: 'Dedicated Trader',
    description: 'Place 100 bets',
    icon: 'cash',
    requirement: 100,
    type: 'bets',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bets_250',
    title: 'Market Enthusiast',
    description: 'Place 250 bets',
    icon: 'cash',
    requirement: 250,
    type: 'bets',
    reward: { coins: 250 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bets_500',
    title: 'Market Veteran',
    description: 'Place 500 bets',
    icon: 'cash',
    requirement: 500,
    type: 'bets',
    reward: { coins: 500 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bets_1000',
    title: 'Trading Addict',
    description: 'Place 1000 bets',
    icon: 'cash',
    requirement: 1000,
    type: 'bets',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Coins achievements
  {
    id: 'coins_1000',
    title: 'Coin Collector',
    description: 'Accumulate 1,000 coins',
    icon: 'logo-bitcoin',
    requirement: 1000,
    type: 'coins',
    reward: { luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'coins_5000',
    title: 'Crypto Whale',
    description: 'Accumulate 5,000 coins',
    icon: 'logo-bitcoin',
    requirement: 5000,
    type: 'coins',
    reward: { luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'coins_10000',
    title: 'Crypto Millionaire',
    description: 'Accumulate 10,000 coins',
    icon: 'logo-bitcoin',
    requirement: 10000,
    type: 'coins',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'coins_50000',
    title: 'Crypto Tycoon',
    description: 'Accumulate 50,000 coins',
    icon: 'logo-bitcoin',
    requirement: 50000,
    type: 'coins',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'coins_100000',
    title: 'Crypto Mogul',
    description: 'Accumulate 100,000 coins',
    icon: 'logo-bitcoin',
    requirement: 100000,
    type: 'coins',
    reward: { coins: 2000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Level achievements
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    icon: 'star',
    requirement: 5,
    type: 'level',
    reward: { coins: 200 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'level_10',
    title: 'Trading Pro',
    description: 'Reach level 10',
    icon: 'star',
    requirement: 10,
    type: 'level',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'level_20',
    title: 'Trading Expert',
    description: 'Reach level 20',
    icon: 'star',
    requirement: 20,
    type: 'level',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'level_50',
    title: 'Trading Master',
    description: 'Reach level 50',
    icon: 'star',
    requirement: 50,
    type: 'level',
    reward: { coins: 2500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'level_100',
    title: 'Trading Legend',
    description: 'Reach level 100',
    icon: 'star',
    requirement: 100,
    type: 'level',
    reward: { coins: 5000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Bull/Bear specific achievements
  {
    id: 'bull_wins_25',
    title: 'Bull Market Master',
    description: 'Win 25 bull predictions',
    icon: 'trending-up',
    requirement: 25,
    type: 'bull_wins',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bull_wins_50',
    title: 'Bull Market Expert',
    description: 'Win 50 bull predictions',
    icon: 'trending-up',
    requirement: 50,
    type: 'bull_wins',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bull_wins_100',
    title: 'Bull Market Legend',
    description: 'Win 100 bull predictions',
    icon: 'trending-up',
    requirement: 100,
    type: 'bull_wins',
    reward: { coins: 250, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bear_wins_25',
    title: 'Bear Market Master',
    description: 'Win 25 bear predictions',
    icon: 'trending-down',
    requirement: 25,
    type: 'bear_wins',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bear_wins_50',
    title: 'Bear Market Expert',
    description: 'Win 50 bear predictions',
    icon: 'trending-down',
    requirement: 50,
    type: 'bear_wins',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'bear_wins_100',
    title: 'Bear Market Legend',
    description: 'Win 100 bear predictions',
    icon: 'trending-down',
    requirement: 100,
    type: 'bear_wins',
    reward: { coins: 250, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Wheel spins achievements
  {
    id: 'wheel_spins_10',
    title: 'Wheel Enthusiast',
    description: 'Spin the wheel 10 times',
    icon: 'sync',
    requirement: 10,
    type: 'wheel_spins',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wheel_spins_25',
    title: 'Wheel Addict',
    description: 'Spin the wheel 25 times',
    icon: 'sync',
    requirement: 25,
    type: 'wheel_spins',
    reward: { coins: 250 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wheel_spins_50',
    title: 'Wheel Master',
    description: 'Spin the wheel 50 times',
    icon: 'sync',
    requirement: 50,
    type: 'wheel_spins',
    reward: { coins: 500 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'wheel_spins_100',
    title: 'Wheel of Fortune',
    description: 'Spin the wheel 100 times',
    icon: 'sync',
    requirement: 100,
    type: 'wheel_spins',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Daily login achievements
  {
    id: 'daily_login_3',
    title: 'Regular Trader',
    description: 'Log in for 3 consecutive days',
    icon: 'calendar',
    requirement: 3,
    type: 'daily_login',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'daily_login_7',
    title: 'Dedicated Trader',
    description: 'Log in for 7 consecutive days',
    icon: 'calendar',
    requirement: 7,
    type: 'daily_login',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'daily_login_14',
    title: 'Loyal Trader',
    description: 'Log in for 14 consecutive days',
    icon: 'calendar',
    requirement: 14,
    type: 'daily_login',
    reward: { coins: 200 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'daily_login_30',
    title: 'Trading Devotee',
    description: 'Log in for 30 consecutive days',
    icon: 'calendar',
    requirement: 30,
    type: 'daily_login',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Pattern recognition achievements
  {
    id: 'pattern_recognition_5',
    title: 'Pattern Spotter',
    description: 'Correctly identify 5 candle patterns',
    icon: 'analytics',
    requirement: 5,
    type: 'pattern_recognition',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'pattern_recognition_15',
    title: 'Pattern Expert',
    description: 'Correctly identify 15 candle patterns',
    icon: 'analytics',
    requirement: 15,
    type: 'pattern_recognition',
    reward: { coins: 250 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'pattern_recognition_30',
    title: 'Pattern Master',
    description: 'Correctly identify 30 candle patterns',
    icon: 'analytics',
    requirement: 30,
    type: 'pattern_recognition',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Perfect day achievements
  {
    id: 'perfect_day_1',
    title: 'Perfect Day',
    description: 'Make all correct predictions in a single day',
    icon: 'sunny',
    requirement: 1,
    type: 'perfect_day',
    reward: { coins: 200 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'perfect_day_3',
    title: 'Perfect Week',
    description: 'Have 3 perfect days',
    icon: 'sunny',
    requirement: 3,
    type: 'perfect_day',
    reward: { coins: 500 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'perfect_day_7',
    title: 'Perfect Trader',
    description: 'Have 7 perfect days',
    icon: 'sunny',
    requirement: 7,
    type: 'perfect_day',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Comeback achievements
  {
    id: 'comeback_1',
    title: 'Comeback Kid',
    description: 'Win after 3 consecutive losses',
    icon: 'refresh',
    requirement: 1,
    type: 'comeback',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'comeback_5',
    title: 'Phoenix Trader',
    description: 'Win after 3 consecutive losses 5 times',
    icon: 'refresh',
    requirement: 5,
    type: 'comeback',
    reward: { coins: 150 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'comeback_10',
    title: 'Resilient Trader',
    description: 'Win after 3 consecutive losses 10 times',
    icon: 'refresh',
    requirement: 10,
    type: 'comeback',
    reward: { coins: 300, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Accuracy achievements
  {
    id: 'accuracy_60',
    title: 'Sharp Eye',
    description: 'Maintain 60% prediction accuracy (min. 50 bets)',
    icon: 'eye',
    requirement: 60,
    type: 'accuracy',
    reward: { coins: 200 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'accuracy_70',
    title: 'Precision Trader',
    description: 'Maintain 70% prediction accuracy (min. 50 bets)',
    icon: 'eye',
    requirement: 70,
    type: 'accuracy',
    reward: { coins: 500 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'accuracy_80',
    title: 'Trading Savant',
    description: 'Maintain 80% prediction accuracy (min. 50 bets)',
    icon: 'eye',
    requirement: 80,
    type: 'accuracy',
    reward: { coins: 1000, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // Time played achievements
  {
    id: 'time_played_1',
    title: 'Rookie Trader',
    description: 'Play for 1 hour',
    icon: 'time',
    requirement: 1,
    type: 'time_played',
    reward: { coins: 50 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'time_played_5',
    title: 'Dedicated Trader',
    description: 'Play for 5 hours',
    icon: 'time',
    requirement: 5,
    type: 'time_played',
    reward: { coins: 150 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'time_played_10',
    title: 'Trading Enthusiast',
    description: 'Play for 10 hours',
    icon: 'time',
    requirement: 10,
    type: 'time_played',
    reward: { coins: 300 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'time_played_24',
    title: 'Trading Addict',
    description: 'Play for 24 hours',
    icon: 'time',
    requirement: 24,
    type: 'time_played',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  },
  
  // No loss streak achievements
  {
    id: 'no_loss_streak_10',
    title: 'Cautious Trader',
    description: 'Make 10 bets without losing',
    icon: 'shield',
    requirement: 10,
    type: 'no_loss_streak',
    reward: { coins: 100 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'no_loss_streak_20',
    title: 'Calculated Trader',
    description: 'Make 20 bets without losing',
    icon: 'shield',
    requirement: 20,
    type: 'no_loss_streak',
    reward: { coins: 250 },
    unlocked: false,
    progress: 0
  },
  {
    id: 'no_loss_streak_30',
    title: 'Flawless Trader',
    description: 'Make 30 bets without losing',
    icon: 'shield',
    requirement: 30,
    type: 'no_loss_streak',
    reward: { coins: 500, luckyBonus: true },
    unlocked: false,
    progress: 0
  }
];

export const getAchievementsByType = (type: AchievementType): Achievement[] => {
  return achievements.filter(achievement => achievement.type === type);
};

export const getAchievementById = (id: string): Achievement | undefined => {
  return achievements.find(achievement => achievement.id === id);
};
