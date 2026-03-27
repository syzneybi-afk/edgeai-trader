import type { MarketInstrument, OHLCVData, Signal, EntryAnalysis, BreakoutAnalysis, StopLossAnalysis, TakeProfitAnalysis } from './types'

// Generate realistic OHLCV data
export function generateOHLCVData(basePrice: number, periods: number = 100): OHLCVData {
  const timestamp: number[] = []
  const open: number[] = []
  const high: number[] = []
  const low: number[] = []
  const close: number[] = []
  const volume: number[] = []
  
  let currentPrice = basePrice
  const now = Date.now()
  
  for (let i = 0; i < periods; i++) {
    timestamp.push(now - (periods - i) * 60000) // 1 minute candles
    
    const volatility = basePrice * 0.002 // 0.2% volatility
    const change = (Math.random() - 0.5) * volatility * 2
    
    const openPrice = currentPrice
    const closePrice = currentPrice + change
    const highPrice = Math.max(openPrice, closePrice) + Math.random() * volatility
    const lowPrice = Math.min(openPrice, closePrice) - Math.random() * volatility
    
    open.push(openPrice)
    high.push(highPrice)
    low.push(lowPrice)
    close.push(closePrice)
    volume.push(Math.floor(Math.random() * 10000) + 1000)
    
    currentPrice = closePrice
  }
  
  return { timestamp, open, high, low, close, volume }
}

// Mock instruments
export const mockInstruments: MarketInstrument[] = [
  // Forex
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', price: 1.0875, change: 0.0012, changePercent: 0.11 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', price: 1.2654, change: -0.0023, changePercent: -0.18 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex', price: 149.85, change: 0.45, changePercent: 0.30 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex', price: 0.6542, change: 0.0008, changePercent: 0.12 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'forex', price: 1.3625, change: -0.0015, changePercent: -0.11 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'forex', price: 0.8845, change: 0.0018, changePercent: 0.20 },
  
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'crypto', price: 67542.50, change: 1250.00, changePercent: 1.89 },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'crypto', price: 3425.80, change: -45.20, changePercent: -1.30 },
  { symbol: 'SOL/USD', name: 'Solana / US Dollar', category: 'crypto', price: 142.35, change: 8.50, changePercent: 6.35 },
  { symbol: 'BNB/USD', name: 'BNB / US Dollar', category: 'crypto', price: 598.40, change: 12.30, changePercent: 2.10 },
  { symbol: 'XRP/USD', name: 'Ripple / US Dollar', category: 'crypto', price: 0.5234, change: 0.0125, changePercent: 2.45 },
  
  // Synthetic Indices
  { symbol: 'V10', name: 'Volatility 10 Index', category: 'synthetic', price: 9845.23, change: 45.67, changePercent: 0.47 },
  { symbol: 'V25', name: 'Volatility 25 Index', category: 'synthetic', price: 12456.78, change: -89.34, changePercent: -0.71 },
  { symbol: 'V50', name: 'Volatility 50 Index', category: 'synthetic', price: 8234.56, change: 123.45, changePercent: 1.52 },
  { symbol: 'V75', name: 'Volatility 75 Index', category: 'synthetic', price: 15678.90, change: -234.56, changePercent: -1.47 },
  { symbol: 'V100', name: 'Volatility 100 Index', category: 'synthetic', price: 6789.12, change: 78.90, changePercent: 1.18 },
  { symbol: 'BOOM500', name: 'Boom 500 Index', category: 'synthetic', price: 7654.32, change: 156.78, changePercent: 2.09 },
  { symbol: 'CRASH500', name: 'Crash 500 Index', category: 'synthetic', price: 8321.45, change: -198.76, changePercent: -2.33 },
]

// Generate entry analysis
function generateEntryAnalysis(price: number, atr: number, isBullish: boolean): EntryAnalysis {
  const entryTypes = ['immediate', 'pullback', 'breakout', 'retest'] as const
  const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)]
  
  const entryReasons: Record<typeof entryType, string> = {
    immediate: 'Price at optimal entry with momentum confirmation',
    pullback: 'Wait for retracement to key support/resistance level',
    breakout: 'Enter on confirmed breakout above resistance',
    retest: 'Enter on successful retest of broken level'
  }
  
  const confirmations = [
    'RSI divergence confirmed',
    'Volume spike detected',
    'EMA crossover signal',
    'MACD histogram turning',
    'Candlestick pattern formed',
    'Support/resistance bounce'
  ]
  
  return {
    entry_type: entryType,
    entry_zone: {
      low: price - (atr * 0.5),
      high: price + (atr * 0.3),
      optimal: price - (atr * 0.1)
    },
    entry_reason: entryReasons[entryType],
    entry_confirmation: confirmations.slice(0, Math.floor(Math.random() * 3) + 2)
  }
}

// Generate breakout analysis
function generateBreakoutAnalysis(price: number, atr: number, isBullish: boolean): BreakoutAnalysis {
  const isBreakout = Math.random() > 0.4
  const breakoutStrength = isBreakout ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 20
  
  const consolidationHigh = price * (1 + Math.random() * 0.015)
  const consolidationLow = price * (1 - Math.random() * 0.015)
  const breakoutLevel = isBullish ? consolidationHigh : consolidationLow
  
  return {
    is_breakout: isBreakout,
    breakout_type: isBreakout ? (isBullish ? 'bullish' : 'bearish') : 'none',
    breakout_level: breakoutLevel,
    breakout_strength: breakoutStrength,
    consolidation_range: {
      high: consolidationHigh,
      low: consolidationLow
    },
    retest_zone: isBreakout ? {
      low: breakoutLevel - (atr * 0.3),
      high: breakoutLevel + (atr * 0.2)
    } : null,
    volume_confirmation: Math.random() > 0.3
  }
}

// Generate stop loss analysis
function generateSLAnalysis(price: number, atr: number, isBullish: boolean, support: number[], resistance: number[]): StopLossAnalysis {
  const slTypes = ['structure', 'atr', 'swing', 'percentage'] as const
  const slType = slTypes[Math.floor(Math.random() * slTypes.length)]
  
  let slPrice: number
  let slReason: string
  let invalidationLevel: number
  
  switch (slType) {
    case 'structure':
      slPrice = isBullish 
        ? (support[0] || price * 0.98) - (atr * 0.3)
        : (resistance[0] || price * 1.02) + (atr * 0.3)
      slReason = `Below ${isBullish ? 'support' : 'Above resistance'} structure at ${(support[0] || price * 0.98).toFixed(4)}`
      invalidationLevel = isBullish ? price * 0.96 : price * 1.04
      break
    case 'atr':
      slPrice = isBullish ? price - (atr * 2) : price + (atr * 2)
      slReason = '2x ATR from entry for volatility protection'
      invalidationLevel = isBullish ? price - (atr * 2.5) : price + (atr * 2.5)
      break
    case 'swing':
      slPrice = isBullish ? price * 0.975 : price * 1.025
      slReason = `Below recent swing ${isBullish ? 'low' : 'high'}`
      invalidationLevel = isBullish ? price * 0.965 : price * 1.035
      break
    default:
      slPrice = isBullish ? price * 0.98 : price * 1.02
      slReason = '2% maximum risk tolerance'
      invalidationLevel = isBullish ? price * 0.97 : price * 1.03
  }
  
  const pipDistance = Math.abs(price - slPrice) * (price > 100 ? 1 : 10000)
  const percentageRisk = Math.abs((slPrice - price) / price) * 100
  
  return {
    sl_price: slPrice,
    sl_type: slType,
    sl_reason: slReason,
    pip_distance: Math.round(pipDistance * 10) / 10,
    percentage_risk: Math.round(percentageRisk * 100) / 100,
    invalidation_level: invalidationLevel
  }
}

// Generate take profit analysis
function generateTPAnalysis(price: number, atr: number, isBullish: boolean, resistance: number[], support: number[]): TakeProfitAnalysis {
  const tp1Price = isBullish ? price + atr : price - atr
  const tp2Price = isBullish ? price + (atr * 2) : price - (atr * 2)
  const tp3Price = isBullish ? price + (atr * 3) : price - (atr * 3)
  
  const nearestTarget = isBullish 
    ? resistance[0] || price * 1.02
    : support[0] || price * 0.98
  
  return {
    tp1: {
      price: tp1Price,
      ratio: 1,
      reason: `1:1 R:R at ${tp1Price.toFixed(price > 100 ? 2 : 5)} - Conservative target`
    },
    tp2: {
      price: tp2Price,
      ratio: 2,
      reason: `1:2 R:R at ${tp2Price.toFixed(price > 100 ? 2 : 5)} - Near ${isBullish ? 'resistance' : 'support'} zone`
    },
    tp3: {
      price: tp3Price,
      ratio: 3,
      reason: `1:3 R:R at ${tp3Price.toFixed(price > 100 ? 2 : 5)} - Extended target`
    },
    trailing_stop_trigger: tp1Price
  }
}

// Generate mock signal from OHLCV data
export function generateMockSignal(instrument: MarketInstrument, timeframe: string): Signal {
  const signals = ['BUY', 'SELL', 'STRONG_BUY', 'STRONG_SELL', 'NEUTRAL'] as const
  const strengths = ['Weak', 'Moderate', 'Strong', 'Very Strong'] as const
  const reasons = [
    'RSI oversold',
    'RSI overbought',
    'MACD bullish crossover',
    'MACD bearish crossover',
    'EMA bullish alignment',
    'EMA bearish alignment',
    'Price above support',
    'Price below resistance',
    'Breakout confirmed',
    'Trend continuation'
  ]
  
  const randomSignal = signals[Math.floor(Math.random() * signals.length)]
  const isBullish = randomSignal === 'BUY' || randomSignal === 'STRONG_BUY'
  const confidence = Math.floor(Math.random() * 40) + 60
  
  const volatility = instrument.price * 0.01
  const atr = volatility * 1.5
  
  const support = [
    instrument.price * 0.98,
    instrument.price * 0.96,
    instrument.price * 0.94
  ]
  const resistance = [
    instrument.price * 1.02,
    instrument.price * 1.04,
    instrument.price * 1.06
  ]
  
  return {
    symbol: instrument.symbol,
    timeframe,
    current_price: instrument.price,
    signal: randomSignal,
    strength: strengths[Math.floor(Math.random() * strengths.length)],
    confidence,
    reasons: reasons.slice(0, Math.floor(Math.random() * 3) + 2),
    entry_zone: {
      low: instrument.price - (atr * 0.5),
      high: instrument.price + (atr * 0.3)
    },
    stop_loss: isBullish 
      ? instrument.price - (atr * 2) 
      : instrument.price + (atr * 2),
    take_profit: {
      tp1: isBullish ? instrument.price + atr : instrument.price - atr,
      tp2: isBullish ? instrument.price + (atr * 2) : instrument.price - (atr * 2),
      tp3: isBullish ? instrument.price + (atr * 3) : instrument.price - (atr * 3)
    },
    risk_reward_ratio: Math.round((Math.random() * 2 + 1) * 10) / 10,
    indicators: {
      rsi: Math.random() * 100,
      macd_histogram: (Math.random() - 0.5) * 0.002,
      ema_9: instrument.price * (1 + (Math.random() - 0.5) * 0.01),
      ema_21: instrument.price * (1 + (Math.random() - 0.5) * 0.02)
    },
    support_resistance: {
      support,
      resistance
    },
    // Enhanced analysis
    entry_analysis: generateEntryAnalysis(instrument.price, atr, isBullish),
    breakout_analysis: generateBreakoutAnalysis(instrument.price, atr, isBullish),
    sl_analysis: generateSLAnalysis(instrument.price, atr, isBullish, support, resistance),
    tp_analysis: generateTPAnalysis(instrument.price, atr, isBullish, resistance, support)
  }
}
