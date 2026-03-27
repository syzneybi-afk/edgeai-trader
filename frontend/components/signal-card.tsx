'use client'

import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Award } from 'lucide-react'

interface SignalCardProps {
  signal: Signal
  onClick?: () => void
  isActive?: boolean
}

export function SignalCard({ signal, onClick, isActive }: SignalCardProps) {
  const isBullish = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY'
  const isBearish = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL'
  const isNeutral = signal.signal === 'NEUTRAL'
  
  const signalColor = isBullish 
    ? 'text-bullish' 
    : isBearish 
      ? 'text-bearish' 
      : 'text-neutral'
  
  const bgGlow = isBullish
    ? 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
    : isBearish
      ? 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]'
      : 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]'

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all duration-300 cursor-pointer",
        bgGlow,
        isActive && "ring-2 ring-primary border-primary",
        "hover:border-muted-foreground/30"
      )}
    >
      {/* Signal Badge */}
      <div className={cn(
        "absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-lg",
        isBullish && "bg-bullish/20 text-bullish",
        isBearish && "bg-bearish/20 text-bearish",
        isNeutral && "bg-neutral/20 text-neutral"
      )}>
        {signal.signal.replace('_', ' ')}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{signal.symbol}</h3>
          <p className="text-xs text-muted-foreground">{signal.timeframe}</p>
        </div>
        <div className={cn("p-2 rounded-full", isBullish ? "bg-bullish/10" : isBearish ? "bg-bearish/10" : "bg-neutral/10")}>
          {isBullish && <TrendingUp className="w-5 h-5 text-bullish" />}
          {isBearish && <TrendingDown className="w-5 h-5 text-bearish" />}
          {isNeutral && <Minus className="w-5 h-5 text-neutral" />}
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-2xl font-mono font-bold text-foreground">
          {formatPrice(signal.current_price)}
        </span>
      </div>

      {/* Confidence & Strength */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">{signal.confidence}%</span>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          signal.strength === 'Very Strong' && "bg-primary/20 text-primary",
          signal.strength === 'Strong' && "bg-bullish/20 text-bullish",
          signal.strength === 'Moderate' && "bg-neutral/20 text-neutral",
          signal.strength === 'Weak' && "bg-muted text-muted-foreground"
        )}>
          {signal.strength}
        </div>
      </div>

      {/* Entry Zone */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3" /> Entry Zone
          </span>
          <span className="font-mono text-info">
            {formatPrice(signal.entry_zone.low)} - {formatPrice(signal.entry_zone.high)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Stop Loss
          </span>
          <span className="font-mono text-bearish">{formatPrice(signal.stop_loss)}</span>
        </div>
      </div>

      {/* Take Profit Levels */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">TP1</span>
          <span className="font-mono text-bullish">{formatPrice(signal.take_profit.tp1)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">TP2</span>
          <span className="font-mono text-bullish/80">{formatPrice(signal.take_profit.tp2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">TP3</span>
          <span className="font-mono text-bullish/60">{formatPrice(signal.take_profit.tp3)}</span>
        </div>
      </div>

      {/* Risk/Reward */}
      <div className={cn(
        "flex items-center justify-between p-2 rounded-md",
        signal.risk_reward_ratio >= 1.5 ? "bg-bullish/10" : "bg-bearish/10"
      )}>
        <span className="text-xs text-muted-foreground">R:R Ratio</span>
        <span className={cn(
          "font-bold text-sm",
          signal.risk_reward_ratio >= 1.5 ? "text-bullish" : "text-bearish"
        )}>
          1:{signal.risk_reward_ratio}
        </span>
      </div>

      {/* Pulse indicator for active signals */}
      {(signal.signal === 'STRONG_BUY' || signal.signal === 'STRONG_SELL') && (
        <div className={cn(
          "absolute top-2 left-2 w-2 h-2 rounded-full signal-pulse",
          isBullish ? "bg-bullish" : "bg-bearish"
        )} />
      )}
    </div>
  )
}
