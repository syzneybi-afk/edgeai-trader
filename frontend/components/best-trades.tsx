'use client'

import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/types'
import { Crown, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface BestTradesProps {
  signals: Signal[]
  onSelectSignal: (signal: Signal) => void
}

export function BestTrades({ signals, onSelectSignal }: BestTradesProps) {
  // Sort by confidence and filter strong signals
  const topSignals = signals
    .filter(s => s.signal !== 'NEUTRAL' && s.confidence >= 60)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  if (topSignals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Crown className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No high-confidence signals available</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-accent/5">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Crown className="w-4 h-4 text-accent" />
          Best Trades Now
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Top 5 highest-confidence setups</p>
      </div>

      <div className="divide-y divide-border">
        {topSignals.map((signal, index) => {
          const isBullish = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY'
          
          return (
            <div
              key={`${signal.symbol}-${signal.timeframe}`}
              onClick={() => onSelectSignal(signal)}
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              {/* Rank Badge */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0",
                index === 0 && "bg-accent/20 text-accent",
                index === 1 && "bg-muted text-muted-foreground",
                index === 2 && "bg-orange-500/20 text-orange-500",
                index > 2 && "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>

              {/* Signal Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{signal.symbol}</span>
                  <span className="text-xs text-muted-foreground">{signal.timeframe}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    isBullish ? "bg-bullish/20 text-bullish" : "bg-bearish/20 text-bearish"
                  )}>
                    {signal.signal.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    R:R {signal.risk_reward_ratio}
                  </span>
                </div>
              </div>

              {/* Price & Confidence */}
              <div className="text-right shrink-0">
                <div className="font-mono text-sm text-foreground">
                  {formatPrice(signal.current_price)}
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  signal.confidence >= 80 ? "text-bullish" : 
                  signal.confidence >= 70 ? "text-accent" : 
                  "text-muted-foreground"
                )}>
                  {signal.confidence}%
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
