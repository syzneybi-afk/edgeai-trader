'use client'

import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/types'

interface IndicatorPanelProps {
  signal: Signal
}

export function IndicatorPanel({ signal }: IndicatorPanelProps) {
  const { indicators, support_resistance } = signal

  const getRSIStatus = (rsi: number | null) => {
    if (rsi === null) return { status: 'N/A', color: 'text-muted-foreground' }
    if (rsi >= 70) return { status: 'Overbought', color: 'text-bearish' }
    if (rsi <= 30) return { status: 'Oversold', color: 'text-bullish' }
    return { status: 'Neutral', color: 'text-neutral' }
  }

  const getMACDStatus = (histogram: number | null) => {
    if (histogram === null) return { status: 'N/A', color: 'text-muted-foreground' }
    if (histogram > 0) return { status: 'Bullish', color: 'text-bullish' }
    return { status: 'Bearish', color: 'text-bearish' }
  }

  const rsiStatus = getRSIStatus(indicators.rsi)
  const macdStatus = getMACDStatus(indicators.macd_histogram)

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  return (
    <div className="space-y-4">
      {/* RSI */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">RSI (14)</h4>
          <span className={cn("text-sm font-medium", rsiStatus.color)}>
            {rsiStatus.status}
          </span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[30%] bg-bullish/30" />
          <div className="absolute inset-y-0 right-0 w-[30%] bg-bearish/30" />
          {indicators.rsi !== null && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background"
              style={{ left: `${Math.min(100, Math.max(0, indicators.rsi))}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>30</span>
          <span className="font-mono text-foreground">{indicators.rsi?.toFixed(1) ?? 'N/A'}</span>
          <span>70</span>
        </div>
      </div>

      {/* MACD */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">MACD</h4>
          <span className={cn("text-sm font-medium", macdStatus.color)}>
            {macdStatus.status}
          </span>
        </div>
        <div className="text-center">
          <span className={cn(
            "text-2xl font-mono font-bold",
            indicators.macd_histogram !== null && indicators.macd_histogram > 0 
              ? "text-bullish" 
              : "text-bearish"
          )}>
            {indicators.macd_histogram !== null 
              ? (indicators.macd_histogram > 0 ? '+' : '') + indicators.macd_histogram.toFixed(6)
              : 'N/A'
            }
          </span>
          <p className="text-xs text-muted-foreground mt-1">Histogram</p>
        </div>
      </div>

      {/* EMAs */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-medium text-foreground mb-3">EMA Levels</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">EMA 9</span>
            <span className="font-mono text-foreground">{formatPrice(indicators.ema_9)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">EMA 21</span>
            <span className="font-mono text-foreground">{formatPrice(indicators.ema_21)}</span>
          </div>
        </div>
        {indicators.ema_9 !== null && indicators.ema_21 !== null && (
          <div className={cn(
            "mt-3 p-2 rounded text-xs text-center font-medium",
            indicators.ema_9 > indicators.ema_21 
              ? "bg-bullish/10 text-bullish" 
              : "bg-bearish/10 text-bearish"
          )}>
            {indicators.ema_9 > indicators.ema_21 ? 'Bullish Crossover' : 'Bearish Crossover'}
          </div>
        )}
      </div>

      {/* Support & Resistance */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-medium text-foreground mb-3">Support & Resistance</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Resistance Levels</p>
            <div className="space-y-1">
              {support_resistance.resistance.slice(0, 3).map((level, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-bearish/60 rounded" style={{ opacity: 1 - i * 0.25 }} />
                  <span className="font-mono text-sm text-foreground">{formatPrice(level)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-1">Support Levels</p>
            <div className="space-y-1">
              {support_resistance.support.slice(0, 3).map((level, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-bullish/60 rounded" style={{ opacity: 1 - i * 0.25 }} />
                  <span className="font-mono text-sm text-foreground">{formatPrice(level)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
