'use client'

import { cn } from '@/lib/utils'
import type { MarketInstrument } from '@/lib/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MarketOverviewProps {
  instruments: MarketInstrument[]
  onSelect?: (instrument: MarketInstrument) => void
  selectedSymbol?: string
}

export function MarketOverview({ instruments, onSelect, selectedSymbol }: MarketOverviewProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  const formatChange = (change: number, isPercent: boolean = false) => {
    const formatted = isPercent 
      ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
      : `${change >= 0 ? '+' : ''}${formatPrice(Math.abs(change))}`
    return formatted
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Symbol</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Change</th>
              <th className="text-right p-3 font-medium text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((instrument) => {
              const isPositive = instrument.change >= 0
              return (
                <tr 
                  key={instrument.symbol}
                  onClick={() => onSelect?.(instrument)}
                  className={cn(
                    "border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/20",
                    selectedSymbol === instrument.symbol && "bg-primary/10"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        instrument.category === 'forex' && "bg-info",
                        instrument.category === 'crypto' && "bg-accent",
                        instrument.category === 'synthetic' && "bg-primary"
                      )} />
                      <div>
                        <p className="font-medium text-foreground">{instrument.symbol}</p>
                        <p className="text-xs text-muted-foreground">{instrument.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-foreground">
                    {formatPrice(instrument.price)}
                  </td>
                  <td className={cn(
                    "p-3 text-right font-mono",
                    isPositive ? "text-bullish" : "text-bearish"
                  )}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatChange(instrument.change)}
                    </div>
                  </td>
                  <td className={cn(
                    "p-3 text-right font-mono font-medium",
                    isPositive ? "text-bullish" : "text-bearish"
                  )}>
                    {formatChange(instrument.changePercent, true)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
