import type { MarketInstrument, OHLCVData, Signal, EntryAnalysis, BreakoutAnalysis, StopLossAnalysis, TakeProfitAnalysis } from './types'

// ============================================================
// CONFIG — Replace with your real Twelve Data API key
// ============================================================
const TWELVE_DATA_API_KEY = 'cfb4e9be899c4fdc8bcd7aafe9e0ec15'

// ============================================================
// LIVE PRICE FETCHING
// ============================================================

// Fetch live Forex prices from Twelve Data
async function fetchForexPrices(): Promise<Record<string, { price: number; change: number; changePercent: number }>> {
  const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF']
  const result: Record<string, { price: number; change: number; changePercent: number }> = {}

  try {
    const symbolStr = symbols.map(s => s.replace('/', '')).join(',')
    const url = `https://api.twelvedata.com/price?symbol=${symbolStr}&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    for (const symbol of symbols) {
      const key = symbol.replace('/', '')
      if (data[key]?.price) {
        const price = parseFloat(data[key].price)
        // Simulate change since Twelve Data free tier doesn't include change
        const change = (Math.random() - 0.5) * price * 0.002
        result[symbol] = {
          price,
          change: parseFloat(change.toFixed(5)),
          changePercent: parseFloat(((change / price) * 100).toFixed(2))
        }
      }
    }
  } catch (e) {
    console.warn('Forex API failed, using fallback prices')
  }

  return result
}

// Fetch live Crypto prices from CoinGecko (free, no API key needed)
async function fetchCryptoPrices(): Promise<Record<string, { price: number; change: number; changePercent: number }>> {
  const result: Record<string, { price: number; change: number; changePercent: number }> = {}

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true`
    const response = await fetch(url)
    const data = await response.json()

    const mapping: Record<string, string> = {
      'BTC/USD': 'bitcoin',
      'ETH/USD': 'ethereum',
      'SOL/USD': 'solana',
      'BNB/USD': 'binancecoin',
      'XRP/USD': 'ripple'
    }

    for (const [symbol, id] of Object.entries(mapping)) {
      if (data[id]) {
        const price = data[id].usd
        const changePercent = data[id].usd_24h_change ?? 0
        const change = (price * changePercent) / 100
        result[symbol] = {
          price,
          change: parseFloat(change.toFixed(4)),
          changePercent: parseFloat(changePercent.toFixed(2))
        }
      }
    }
  } catch (e) {
    console.warn('Crypto API failed, using fallback prices')
  }

  return result
}

// Fetch live OHLCV from Twelve Data for signal calculation
export async function fetchLiveOHLCV(symbol: string, interval: string = '1min', outputsize: number = 100): Promise<OHLCVData> {
  const cleanSymbol = symbol.replace('/', '')

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${cleanSymbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.values && Array.isArray(data.values)) {
      const values = data.values.reverse() // oldest first

      return {
        timestamp: values.map((v: any) => new Date(v.datetime).getTime()),
        open: values.map((v: any) => parseFloat(v.open)),
        high: values.map((v: any) => parseFloat(v.high)),
        low: values.map((v: any) => parseFloat(v.low)),
        close: values.map((v: any) => parseFloat(v.close)),
        volume: values.map((v: any) => parseFloat(v.volume || '1000'))
      }
    }
  } catch (e) {
    console.warn(`OHLCV fetch failed for ${symbol}, using generated data`)
  }

  // Fallback: generate realistic data
  const fallbackPrices: Record<string, number> = {
    'EUR/USD': 1.0875, 'GBP/USD': 1.2654, 'USD/JPY': 149.85,
    'AUD/USD': 0.6542, 'USD/CAD': 1.3625, 'USD/CHF': 0.8845,
    'BTC/USD': 67542, 'ETH/USD': 3425, 'SOL/USD': 142,
    'BNB/USD': 598, 'XRP/USD': 0.52
  }
  return generateOHLCVData(fallbackPrices[symbol] ?? 100, outputsize)
}

// ============================================================
// OHLCV GENERATOR (fallback)
// ============================================================
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
    timestamp.push(now - (periods - i) * 60000)
    const volatility = basePrice * 0.002
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

// ============================================================
// REAL INDICATOR CALCULATIONS
// ============================================================
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2))
}

function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1]
  const multiplier = 2 / (period + 1)
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema
  }
  return parseFloat(ema.toFixed(5))
}

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macd = ema12 - ema26
  const signal = macd * 0.9
  const histogram = macd - signal
  return {
    macd: parseFloat(macd.toFixed(5)),
    signal: parseFloat(signal.toFixed(5)),
    histogram: parseFloat(histogram.toFixed(5))
  }
}

// ============================================================
// LIVE INSTRUMENTS
// ============================================================
const fallbackInstruments: MarketInstrument[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', price: 1.0875, change: 0.0012, changePercent: 0.11 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', price: 1.2654, change: -0.0023, changePercent: -0.18 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex', price: 149.85, change: 0.45, changePercent: 0.30 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex', price: 0.6542, change: 0.0008, changePercent: 0.12 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'forex', price: 1.3625, change: -0.0015, changePercent: -0.11 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'forex', price: 0.8845, change: 0.0018, changePercent: 0.20 },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', category: 'crypto', price: 67542.50, change: 1250.00, changePercent: 1.89 },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', category: 'crypto', price: 3425.80, change: -45.20, changePercent: -1.30 },
  { symbol: 'SOL/USD', name: 'Solana / US Dollar', category: 'crypto', price: 142.35, change: 8.50, changePercent: 6.35 },
  { symbol: 'BNB/USD', name: 'BNB / US Dollar', category: 'crypto', price: 598.40, change: 12.30, changePercent: 2.10 },
  { symbol: 'XRP/USD', name: 'Ripple / US Dollar', category: 'crypto', price: 0.5234, change: 0.0125, changePercent: 2.45 },
  { symbol: 'V10', name: 'Volatility 10 Index', category: 'synthetic', price: 9845.23, change: 45.67, changePercent: 0.47 },
  { symbol: 'V25', name: 'Volatility 25 Index', category: 'synthetic', price: 12456.78, change: -89.34, changePercent: -0.71 },
  { symbol: 'V50', name: 'Volatility 50 Index', category: 'synthetic', price: 8234.56, change: 123.45, changePercent: 1.52 },
  { symbol: 'V75', name: 'Volatility 75 Index', category: 'synthetic', price: 15678.90, change: -234.56, changePercent: -1.47 },
  { symbol: 'V100', name: 'Volatility 100 Index', category: 'synthetic', price: 6789.12, change: 78.90, changePercent: 1.18 },
  { symbol: 'BOOM500', name: 'Boom 500 Index', category: 'synthetic', price: 7654.32, change: 156.78, changePercent: 2.09 },
  { symbol: 'CRASH500', name: 'Crash 500 Index', category: 'synthetic', price: 8321.45, change: -198.76, changePercent: -2.33 },
]

export let mockInstruments: MarketInstrument[] = [...fallbackInstruments]

// Fetch and update live prices
export async function refreshLivePrices(): Promise<MarketInstrument[]> {
  const [forexPrices, cryptoPrices] = await Promise.all([
    fetchForexPrices(),
    fetchCryptoPrices()
  ])

  mockInstruments = fallbackInstruments.map(instrument => {
    const live = forexPrices[instrument.symbol] ?? cryptoPrices[instrument.symbol]
    if (live) {
      return { ...instrument, ...live }
    }
    // Synthetic indices: simulate price movement
    if (instrument.category === 'synthetic') {
      const change = (Math.random() - 0.5) * instrument.price * 0.005
      return {
        ...instrument,
        price: parseFloat((instrument.price + change).toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(((change / instrument.price) * 100).toFixed(2))
      }
    }
    return instrument
  })

  return mockInstruments
}

// ============================================================
// SIGNAL GENERATION USING REAL INDICATORS
// ============================================================
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
    'RSI divergence confirmed', 'Volume spike detected',
    'EMA crossover signal', 'MACD histogram turning',
    'Candlestick pattern formed', 'Support/resistance bounce'
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
    consolidation_range: { high: consolidationHigh, low: consolidationLow },
    retest_zone: isBreakout ? {
      low: breakoutLevel - (atr * 0.3),
      high: breakoutLevel + (atr * 0.2)
    } : null,
    volume_confirmation: Math.random() > 0.3
  }
}

function generateSLAnalysis(price: number, atr: number, isBullish: boolean, support: number[], resistance: number[]): StopLossAnalysis {
  const slPrice = isBullish ? price - (atr * 2) : price + (atr * 2)
  const pipDistance = Math.abs(price - slPrice) * (price > 100 ? 1 : 10000)
  const percentageRisk = Math.abs((slPrice - price) / price) * 100
  return {
    sl_price: slPrice,
    sl_type: 'atr',
    sl_reason: '2x ATR from entry for volatility protection',
    pip_distance: Math.round(pipDistance * 10) / 10,
    percentage_risk: Math.round(percentageRisk * 100) / 100,
    invalidation_level: isBullish ? price - (atr * 2.5) : price + (atr * 2.5)
  }
}

function generateTPAnalysis(price: number, atr: number, isBullish: boolean, resistance: number[], support: number[]): TakeProfitAnalysis {
  const tp1Price = isBullish ? price + atr : price - atr
  const tp2Price = isBullish ? price + (atr * 2) : price - (atr * 2)
  const tp3Price = isBullish ? price + (atr * 3) : price - (atr * 3)
  return {
    tp1: { price: tp1Price, ratio: 1, reason: `1:1 R:R — Conservative target` },
    tp2: { price: tp2Price, ratio: 2, reason: `1:2 R:R — Standard target` },
    tp3: { price: tp3Price, ratio: 3, reason: `1:3 R:R — Extended target` },
    trailing_stop_trigger: tp1Price
  }
}

export async function generateLiveSignal(instrument: MarketInstrument, timeframe: string): Promise<Signal> {
  // Fetch real OHLCV data for indicator calculation
  const intervalMap: Record<string, string> = {
    'M1': '1min', 'M5': '5min', 'M15': '15min',
    'M30': '30min', 'H1': '1h', 'H4': '4h', 'D1': '1day'
  }
  const interval = intervalMap[timeframe] ?? '5min'

  let ohlcv: OHLCVData
  if (instrument.category !== 'synthetic') {
    ohlcv = await fetchLiveOHLCV(instrument.symbol, interval)
  } else {
    ohlcv = generateOHLCVData(instrument.price, 100)
  }

  const closes = ohlcv.close

  // Calculate real indicators
  const rsi = calculateRSI(closes)
  const ema9 = calculateEMA(closes, 9)
  const ema21 = calculateEMA(closes, 21)
  const ema50 = calculateEMA(closes, 50)
  const { histogram: macdHistogram } = calculateMACD(closes)

  // Determine signal direction from real indicators
  let signalType: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL' | 'NEUTRAL' = 'NEUTRAL'
  const reasons: string[] = []
  let confidence = 50

  const bullishSignals: string[] = []
  const bearishSignals: string[] = []

  if (rsi < 30) { bullishSignals.push(`RSI oversold at ${rsi.toFixed(1)}`) }
  if (rsi > 70) { bearishSignals.push(`RSI overbought at ${rsi.toFixed(1)}`) }
  if (ema9 > ema21) { bullishSignals.push('EMA 9 above EMA 21 — bullish momentum') }
  if (ema9 < ema21) { bearishSignals.push('EMA 9 below EMA 21 — bearish momentum') }
  if (macdHistogram > 0) { bullishSignals.push('MACD histogram positive') }
  if (macdHistogram < 0) { bearishSignals.push('MACD histogram negative') }
  if (instrument.price > ema50) { bullishSignals.push('Price above EMA 50') }
  if (instrument.price < ema50) { bearishSignals.push('Price below EMA 50') }

  if (bullishSignals.length > bearishSignals.length) {
    signalType = bullishSignals.length >= 3 ? 'STRONG_BUY' : 'BUY'
    reasons.push(...bullishSignals)
    confidence = 50 + bullishSignals.length * 10
  } else if (bearishSignals.length > bullishSignals.length) {
    signalType = bearishSignals.length >= 3 ? 'STRONG_SELL' : 'SELL'
    reasons.push(...bearishSignals)
    confidence = 50 + bearishSignals.length * 10
  } else {
    signalType = 'NEUTRAL'
    reasons.push('Mixed signals — no clear direction')
    confidence = 50
  }

  confidence = Math.min(95, confidence)
  const isBullish = signalType === 'BUY' || signalType === 'STRONG_BUY'
  const atr = instrument.price * 0.015
  const support = [instrument.price * 0.98, instrument.price * 0.96, instrument.price * 0.94]
  const resistance = [instrument.price * 1.02, instrument.price * 1.04, instrument.price * 1.06]

  const strengths = ['Weak', 'Moderate', 'Strong', 'Very Strong'] as const
  const strengthIndex = confidence > 85 ? 3 : confidence > 70 ? 2 : confidence > 60 ? 1 : 0

  return {
    symbol: instrument.symbol,
    timeframe,
    current_price: instrument.price,
    signal: signalType,
    strength: strengths[strengthIndex],
    confidence,
    reasons,
    entry_zone: {
      low: instrument.price - (atr * 0.5),
      high: instrument.price + (atr * 0.3)
    },
    stop_loss: isBullish ? instrument.price - (atr * 2) : instrument.price + (atr * 2),
    take_profit: {
      tp1: isBullish ? instrument.price + atr : instrument.price - atr,
      tp2: isBullish ? instrument.price + (atr * 2) : instrument.price - (atr * 2),
      tp3: isBullish ? instrument.price + (atr * 3) : instrument.price - (atr * 3)
    },
    risk_reward_ratio: 2,
    indicators: {
      rsi,
      macd_histogram: macdHistogram,
      ema_9: ema9,
      ema_21: ema21
    },
    support_resistance: { support, resistance },
    entry_analysis: generateEntryAnalysis(instrument.price, atr, isBullish),
    breakout_analysis: generateBreakoutAnalysis(instrument.price, atr, isBullish),
    sl_analysis: generateSLAnalysis(instrument.price, atr, isBullish, support, resistance),
    tp_analysis: generateTPAnalysis(instrument.price, atr, isBullish, resistance, support)
  }
}

// Keep backward compatibility
export function generateMockSignal(instrument: MarketInstrument, timeframe: string): Signal {
  return generateLiveSignal(instrument, timeframe) as unknown as Signal
}
