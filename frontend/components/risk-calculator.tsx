'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/types'
import { Calculator, DollarSign, Percent, AlertTriangle } from 'lucide-react'

interface RiskCalculatorProps {
  signal: Signal | null
}

export function RiskCalculator({ signal }: RiskCalculatorProps) {
  const [accountBalance, setAccountBalance] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(1)
  const [results, setResults] = useState<{
    lotSize: number
    riskAmount: number
    pipRisk: number
    potentialProfit: { r1: number; r2: number; r3: number }
  } | null>(null)

  useEffect(() => {
    if (!signal) return

    const riskAmount = accountBalance * (riskPercent / 100)
    const pipRisk = Math.abs(signal.current_price - signal.stop_loss) * 10000
    const lotSize = pipRisk > 0 ? riskAmount / (pipRisk * 10) : 0

    setResults({
      lotSize: Math.round(lotSize * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipRisk: Math.round(pipRisk * 10) / 10,
      potentialProfit: {
        r1: Math.round(riskAmount * 100) / 100,
        r2: Math.round(riskAmount * 2 * 100) / 100,
        r3: Math.round(riskAmount * 3 * 100) / 100,
      }
    })
  }, [accountBalance, riskPercent, signal])

  if (!signal) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Calculator className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Select a signal to calculate position size</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Risk Management Calculator
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Balance Input */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Account Balance</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-md text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Risk Percentage Input */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Risk Per Trade</label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-md text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[0.5, 1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => setRiskPercent(v)}
                className={cn(
                  "flex-1 py-1 text-xs rounded border transition-colors",
                  riskPercent === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position Size</span>
              <span className="font-mono font-bold text-foreground">{results.lotSize} lots</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Risk Amount</span>
              <span className="font-mono text-bearish">${results.riskAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pip Risk</span>
              <span className="font-mono text-foreground">{results.pipRisk} pips</span>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Potential Profit</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-bullish/10">
                  <span className="text-sm text-muted-foreground">TP1 (1R)</span>
                  <span className="font-mono text-bullish">+${results.potentialProfit.r1}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-bullish/10">
                  <span className="text-sm text-muted-foreground">TP2 (2R)</span>
                  <span className="font-mono text-bullish">+${results.potentialProfit.r2}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-bullish/10">
                  <span className="text-sm text-muted-foreground">TP3 (3R)</span>
                  <span className="font-mono text-bullish">+${results.potentialProfit.r3}</span>
                </div>
              </div>
            </div>

            {/* Warning for poor R:R */}
            {signal.risk_reward_ratio < 1.5 && (
              <div className="flex items-start gap-2 p-3 rounded bg-neutral/10 border border-neutral/30">
                <AlertTriangle className="w-4 h-4 text-neutral shrink-0 mt-0.5" />
                <p className="text-xs text-neutral">
                  Risk/Reward ratio is below 1:1.5. Consider waiting for a better setup.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
