export interface OHLCVData {
  timestamp: number[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
}

export interface EntryAnalysis {
  entry_type: 'immediate' | 'pullback' | 'breakout' | 'retest'
  entry_zone: {
    low: number
    high: number
    optimal: number
  }
  entry_reason: string
  entry_confirmation: string[]
}

export interface BreakoutAnalysis {
  is_breakout: boolean
  breakout_type: 'bullish' | 'bearish' | 'none'
  breakout_level: number
  breakout_strength: number // 0-100
  consolidation_range: {
    high: number
    low: number
  }
  retest_zone: {
    low: number
    high: number
  } | null
  volume_confirmation: boolean
}

export interface StopLossAnalysis {
  sl_price: number
  sl_type: 'structure' | 'atr' | 'swing' | 'percentage'
  sl_reason: string
  pip_distance: number
  percentage_risk: number
  invalidation_level: number
}

export interface TakeProfitAnalysis {
  tp1: {
    price: number
    ratio: number
    reason: string
  }
  tp2: {
    price: number
    ratio: number
    reason: string
  }
  tp3: {
    price: number
    ratio: number
    reason: string
  }
  trailing_stop_trigger: number
}

export interface Signal {
  symbol: string
  timeframe: string
  current_price: number
  signal: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL' | 'NEUTRAL'
  strength: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong'
  confidence: number
  reasons: string[]
  entry_zone: {
    low: number
    high: number
  }
  stop_loss: number
  take_profit: {
    tp1: number
    tp2: number
    tp3: number
  }
  risk_reward_ratio: number
  indicators: {
    rsi: number | null
    macd_histogram: number | null
    ema_9: number | null
    ema_21: number | null
  }
  support_resistance: {
    support: number[]
    resistance: number[]
  }
  // Enhanced analysis
  entry_analysis?: EntryAnalysis
  breakout_analysis?: BreakoutAnalysis
  sl_analysis?: StopLossAnalysis
  tp_analysis?: TakeProfitAnalysis
}

export interface Indicators {
  ema: Record<string, (number | null)[]>
  rsi: (number | null)[]
  macd: {
    macd: (number | null)[]
    signal: (number | null)[]
    histogram: (number | null)[]
  }
  support_resistance: {
    support: number[]
    resistance: number[]
  }
  data_points: number
}

export interface BreakoutZone {
  consolidation: {
    is_consolidating: boolean
    range_high: number
    range_low: number
    range_size: number
  }
  breakout: {
    type: 'Bullish Breakout' | 'Bearish Breakdown' | 'In Range'
    momentum_score: number
    upper_boundary: number
    lower_boundary: number
  }
  retest_level: number | null
}

export interface MarketInstrument {
  symbol: string
  name: string
  category: 'forex' | 'crypto' | 'synthetic'
  price: number
  change: number
  changePercent: number
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1'
export type MarketType = 'forex' | 'crypto' | 'synthetic' | 'all'
