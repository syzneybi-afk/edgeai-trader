import type { OHLCVData, Signal, Indicators, BreakoutZone } from './types'

const API_BASE = '/api'

export async function fetchIndicators(
  ohlcv: OHLCVData,
  options?: {
    rsi_period?: number
    macd_fast?: number
    macd_slow?: number
    macd_signal?: number
    ema_periods?: number[]
  }
): Promise<Indicators> {
  const response = await fetch(`${API_BASE}/indicators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ohlcv,
      rsi_period: options?.rsi_period ?? 14,
      macd_fast: options?.macd_fast ?? 12,
      macd_slow: options?.macd_slow ?? 26,
      macd_signal: options?.macd_signal ?? 9,
      ema_periods: options?.ema_periods ?? [9, 21, 50, 200]
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch indicators')
  }
  
  return response.json()
}

export async function fetchSignal(
  ohlcv: OHLCVData,
  symbol: string,
  timeframe: string
): Promise<Signal> {
  const response = await fetch(`${API_BASE}/signal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ohlcv, symbol, timeframe })
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch signal')
  }
  
  return response.json()
}

export async function fetchBreakoutZones(ohlcv: OHLCVData): Promise<BreakoutZone> {
  const response = await fetch(`${API_BASE}/breakout-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ohlcv,
      rsi_period: 14,
      macd_fast: 12,
      macd_slow: 26,
      macd_signal: 9,
      ema_periods: [9, 21, 50, 200]
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch breakout zones')
  }
  
  return response.json()
}

export async function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number,
  pipValue: number = 10
): Promise<{
  lot_size: number
  risk_amount: number
  pip_risk: number
  potential_profit: {
    '1r': number
    '2r': number
    '3r': number
  }
}> {
  const params = new URLSearchParams({
    account_balance: accountBalance.toString(),
    risk_percentage: riskPercentage.toString(),
    entry_price: entryPrice.toString(),
    stop_loss: stopLoss.toString(),
    pip_value: pipValue.toString()
  })
  
  const response = await fetch(`${API_BASE}/position-size?${params}`, {
    method: 'POST'
  })
  
  if (!response.ok) {
    throw new Error('Failed to calculate position size')
  }
  
  return response.json()
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE}/health`)
  return response.json()
}
