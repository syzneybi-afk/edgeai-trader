'use client'

import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/types'
import { 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Crosshair,
  Layers,
  BarChart2
} from 'lucide-react'

interface TradeAnalysisProps {
  signal: Signal
}

export function TradeAnalysis({ signal }: TradeAnalysisProps) {
  const isBullish = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY'
  const isBearish = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL'

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  return (
    <div className="space-y-4">
      {/* Entry Zone Analysis */}
      {signal.entry_analysis && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-info/10">
              <Crosshair className="w-4 h-4 text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Entry Zone Analysis</h3>
          </div>
          
          <div className="space-y-3">
            {/* Entry Type Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Entry Type</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium uppercase",
                signal.entry_analysis.entry_type === 'immediate' && "bg-bullish/20 text-bullish",
                signal.entry_analysis.entry_type === 'pullback' && "bg-neutral/20 text-neutral",
                signal.entry_analysis.entry_type === 'breakout' && "bg-primary/20 text-primary",
                signal.entry_analysis.entry_type === 'retest' && "bg-info/20 text-info"
              )}>
                {signal.entry_analysis.entry_type}
              </span>
            </div>

            {/* Entry Zone */}
            <div className="p-3 rounded-md bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Zone Range</span>
                <span className="text-xs font-mono text-info">
                  {formatPrice(signal.entry_analysis.entry_zone.low)} - {formatPrice(signal.entry_analysis.entry_zone.high)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Optimal Entry</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {formatPrice(signal.entry_analysis.entry_zone.optimal)}
                </span>
              </div>
            </div>

            {/* Entry Reason */}
            <p className="text-sm text-muted-foreground italic">
              {signal.entry_analysis.entry_reason}
            </p>

            {/* Confirmations */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Confirmations</span>
              <div className="flex flex-wrap gap-1">
                {signal.entry_analysis.entry_confirmation.map((conf, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bullish/10 text-bullish text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    {conf}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakout Analysis */}
      {signal.breakout_analysis && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "p-1.5 rounded-md",
              signal.breakout_analysis.is_breakout ? "bg-primary/10" : "bg-muted"
            )}>
              <Zap className={cn(
                "w-4 h-4",
                signal.breakout_analysis.is_breakout ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <h3 className="font-semibold text-foreground">Breakout Analysis</h3>
            {signal.breakout_analysis.is_breakout && (
              <span className={cn(
                "ml-auto px-2 py-0.5 rounded text-xs font-bold uppercase animate-pulse",
                signal.breakout_analysis.breakout_type === 'bullish' ? "bg-bullish/20 text-bullish" : "bg-bearish/20 text-bearish"
              )}>
                {signal.breakout_analysis.breakout_type} Breakout
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Consolidation Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-md bg-muted/50">
                <span className="text-xs text-muted-foreground block">Range High</span>
                <span className="font-mono text-sm text-foreground">
                  {formatPrice(signal.breakout_analysis.consolidation_range.high)}
                </span>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <span className="text-xs text-muted-foreground block">Range Low</span>
                <span className="font-mono text-sm text-foreground">
                  {formatPrice(signal.breakout_analysis.consolidation_range.low)}
                </span>
              </div>
            </div>

            {/* Breakout Strength */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Breakout Strength</span>
                <span className={cn(
                  "font-medium",
                  signal.breakout_analysis.breakout_strength >= 70 ? "text-bullish" :
                  signal.breakout_analysis.breakout_strength >= 50 ? "text-neutral" : "text-bearish"
                )}>
                  {signal.breakout_analysis.breakout_strength}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    signal.breakout_analysis.breakout_strength >= 70 ? "bg-bullish" :
                    signal.breakout_analysis.breakout_strength >= 50 ? "bg-neutral" : "bg-bearish"
                  )}
                  style={{ width: `${signal.breakout_analysis.breakout_strength}%` }}
                />
              </div>
            </div>

            {/* Retest Zone */}
            {signal.breakout_analysis.retest_zone && (
              <div className="p-2 rounded-md bg-info/10 border border-info/20">
                <div className="flex items-center gap-2 text-xs text-info mb-1">
                  <Layers className="w-3 h-3" />
                  <span className="font-medium">Retest Zone</span>
                </div>
                <span className="font-mono text-sm text-foreground">
                  {formatPrice(signal.breakout_analysis.retest_zone.low)} - {formatPrice(signal.breakout_analysis.retest_zone.high)}
                </span>
              </div>
            )}

            {/* Volume Confirmation */}
            <div className="flex items-center gap-2">
              <BarChart2 className={cn(
                "w-4 h-4",
                signal.breakout_analysis.volume_confirmation ? "text-bullish" : "text-muted-foreground"
              )} />
              <span className="text-sm text-muted-foreground">Volume Confirmation:</span>
              <span className={cn(
                "text-sm font-medium",
                signal.breakout_analysis.volume_confirmation ? "text-bullish" : "text-bearish"
              )}>
                {signal.breakout_analysis.volume_confirmation ? 'Confirmed' : 'Weak'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stop Loss Analysis */}
      {signal.sl_analysis && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-bearish/10">
              <ShieldAlert className="w-4 h-4 text-bearish" />
            </div>
            <h3 className="font-semibold text-foreground">Stop Loss Analysis</h3>
          </div>

          <div className="space-y-3">
            {/* SL Type & Price */}
            <div className="flex items-center justify-between p-3 rounded-md bg-bearish/5 border border-bearish/20">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {signal.sl_analysis.sl_type} SL
                </span>
                <div className="font-mono text-lg font-bold text-bearish">
                  {formatPrice(signal.sl_analysis.sl_price)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {signal.sl_analysis.pip_distance} pips
                </div>
                <div className="text-sm font-medium text-bearish">
                  -{signal.sl_analysis.percentage_risk}%
                </div>
              </div>
            </div>

            {/* SL Reason */}
            <p className="text-sm text-muted-foreground">
              {signal.sl_analysis.sl_reason}
            </p>

            {/* Invalidation Level */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-neutral" />
                Invalidation Level
              </span>
              <span className="font-mono text-neutral">
                {formatPrice(signal.sl_analysis.invalidation_level)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Take Profit Analysis */}
      {signal.tp_analysis && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-bullish/10">
              <Target className="w-4 h-4 text-bullish" />
            </div>
            <h3 className="font-semibold text-foreground">Take Profit Targets</h3>
          </div>

          <div className="space-y-3">
            {/* TP Levels */}
            {[signal.tp_analysis.tp1, signal.tp_analysis.tp2, signal.tp_analysis.tp3].map((tp, i) => (
              <div 
                key={i}
                className={cn(
                  "p-3 rounded-md border transition-all",
                  i === 0 && "bg-bullish/5 border-bullish/30",
                  i === 1 && "bg-bullish/10 border-bullish/20",
                  i === 2 && "bg-bullish/5 border-bullish/10"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0 && "bg-bullish text-background",
                      i === 1 && "bg-bullish/60 text-background",
                      i === 2 && "bg-bullish/30 text-bullish"
                    )}>
                      {i + 1}
                    </span>
                    <span className="font-mono text-lg font-bold text-foreground">
                      {formatPrice(tp.price)}
                    </span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold",
                    "bg-bullish/20 text-bullish"
                  )}>
                    1:{tp.ratio} R:R
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  {tp.reason}
                </p>
              </div>
            ))}

            {/* Trailing Stop Trigger */}
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isBullish ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                Trailing Stop Trigger
              </span>
              <span className="font-mono text-sm text-info">
                {formatPrice(signal.tp_analysis.trailing_stop_trigger)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
