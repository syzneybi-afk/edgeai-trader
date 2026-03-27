'use client'

import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { mockInstruments, generateOHLCVData, generateMockSignal } from '@/lib/mock-data'
import type { MarketType, Timeframe, Signal, MarketInstrument } from '@/lib/types'
import { 
  Activity, 
  BarChart3, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  Home, 
  LineChart, 
  List,
  Search,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  Calculator,
  Award,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Minus,
  ShieldAlert
} from 'lucide-react'

type Tab = 'signals' | 'chart' | 'analysis' | 'calculator'

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<Tab>('signals')
  const [marketFilter, setMarketFilter] = useState<MarketType>('all')
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument>(mockInstruments[0])
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('H1')
  const [signals, setSignals] = useState<Signal[]>([])
  const [showSignalDetail, setShowSignalDetail] = useState(false)
  const [accountBalance, setAccountBalance] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(2)

  const filteredInstruments = useMemo(() => {
    if (marketFilter === 'all') return mockInstruments
    return mockInstruments.filter(i => i.category === marketFilter)
  }, [marketFilter])

  const chartData = useMemo(() => {
    const ohlcv = generateOHLCVData(selectedInstrument.price, 100)
    return ohlcv.timestamp.map((time, i) => ({
      time,
      open: ohlcv.open[i],
      high: ohlcv.high[i],
      low: ohlcv.low[i],
      close: ohlcv.close[i],
    }))
  }, [selectedInstrument, timeframe])

  useEffect(() => {
    const newSignals = filteredInstruments.map(instrument => 
      generateMockSignal(instrument, timeframe)
    )
    setSignals(newSignals)
    
    if (newSignals.length > 0 && !selectedSignal) {
      const instrumentSignal = newSignals.find(s => s.symbol === selectedInstrument.symbol)
      setSelectedSignal(instrumentSignal || newSignals[0])
    }
  }, [filteredInstruments, timeframe])

  useEffect(() => {
    const signal = signals.find(s => s.symbol === selectedInstrument.symbol)
    if (signal) {
      setSelectedSignal(signal)
    }
  }, [selectedInstrument, signals])

  const handleSignalTap = (signal: Signal) => {
    setSelectedSignal(signal)
    const instrument = mockInstruments.find(i => i.symbol === signal.symbol)
    if (instrument) {
      setSelectedInstrument(instrument)
    }
    setShowSignalDetail(true)
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  // Calculate position size
  const calculatePositionSize = () => {
    if (!selectedSignal) return { lotSize: 0, riskAmount: 0, pipValue: 0 }
    
    const riskAmount = (accountBalance * riskPercent) / 100
    const slDistance = Math.abs(selectedSignal.current_price - selectedSignal.stop_loss)
    const pipValue = selectedSignal.current_price > 100 ? 1 : 0.0001
    const pips = slDistance / pipValue
    const standardLotPipValue = 10
    const lotSize = riskAmount / (pips * standardLotPipValue)
    
    return {
      lotSize: Math.round(lotSize * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipValue: Math.round(pips * 10) / 10
    }
  }

  const positionCalc = calculatePositionSize()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-foreground">EdgeAI</span>
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-bullish/10">
            <Activity className="w-3 h-3 text-bullish animate-pulse" />
            <span className="text-xs font-medium text-bullish">Live</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-lg">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <button className="p-2 rounded-lg">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Market Filter Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {(['all', 'forex', 'crypto', 'synthetic'] as MarketType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setMarketFilter(filter)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all",
                marketFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div className="p-4 space-y-4">
            {/* Top Signals */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Top Signals
              </h2>
              {signals.slice(0, 6).map((signal) => (
                <MobileSignalCard 
                  key={signal.symbol} 
                  signal={signal} 
                  onTap={() => handleSignalTap(signal)}
                  isActive={selectedSignal?.symbol === signal.symbol}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chart Tab */}
        {activeTab === 'chart' && (
          <div className="p-4 space-y-4">
            {/* Symbol Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedInstrument.symbol}</h2>
                <p className="text-xs text-muted-foreground">{selectedInstrument.name}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xl font-mono font-bold",
                  selectedInstrument.change >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {formatPrice(selectedInstrument.price)}
                </span>
                <div className={cn(
                  "text-xs font-medium",
                  selectedInstrument.change >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {selectedInstrument.changePercent >= 0 ? '+' : ''}{selectedInstrument.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {(['M5', 'M15', 'H1', 'H4', 'D1'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap",
                    timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Simplified Chart Placeholder */}
            <div className="bg-card rounded-lg border border-border p-4 h-64 flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Interactive chart</p>
                <p className="text-xs text-muted-foreground/70">Swipe to scroll, pinch to zoom</p>
              </div>
            </div>

            {/* Quick Signal Info */}
            {selectedSignal && (
              <div className={cn(
                "p-4 rounded-lg border",
                selectedSignal.signal.includes('BUY') 
                  ? "bg-bullish/10 border-bullish/30"
                  : selectedSignal.signal.includes('SELL')
                    ? "bg-bearish/10 border-bearish/30"
                    : "bg-neutral/10 border-neutral/30"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-lg font-bold",
                    selectedSignal.signal.includes('BUY') ? "text-bullish" : 
                    selectedSignal.signal.includes('SELL') ? "text-bearish" : "text-neutral"
                  )}>
                    {selectedSignal.signal.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold text-accent">{selectedSignal.confidence}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="text-sm font-mono font-medium text-info">
                      {formatPrice(selectedSignal.entry_zone.low)}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">SL</p>
                    <p className="text-sm font-mono font-medium text-bearish">
                      {formatPrice(selectedSignal.stop_loss)}
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">TP1</p>
                    <p className="text-sm font-mono font-medium text-bullish">
                      {formatPrice(selectedSignal.take_profit.tp1)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && selectedSignal && (
          <div className="p-4 space-y-4">
            {/* Entry Analysis */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-info" />
                Entry Zone
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-info capitalize">
                    {selectedSignal.entry_analysis?.entry_type || 'immediate'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Zone</span>
                  <span className="text-sm font-mono text-foreground">
                    {formatPrice(selectedSignal.entry_zone.low)} - {formatPrice(selectedSignal.entry_zone.high)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Optimal</span>
                  <span className="text-sm font-mono text-primary">
                    {formatPrice(selectedSignal.entry_analysis?.entry_zone?.optimal || selectedSignal.entry_zone.low)}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakout Analysis */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Breakout Analysis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded",
                    selectedSignal.breakout_analysis?.is_breakout 
                      ? "bg-bullish/20 text-bullish"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {selectedSignal.breakout_analysis?.is_breakout ? 'Active Breakout' : 'No Breakout'}
                  </span>
                </div>
                {selectedSignal.breakout_analysis?.is_breakout && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        selectedSignal.breakout_analysis.breakout_type === 'bullish' 
                          ? "text-bullish" 
                          : "text-bearish"
                      )}>
                        {selectedSignal.breakout_analysis.breakout_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${selectedSignal.breakout_analysis.breakout_strength}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-foreground">
                          {selectedSignal.breakout_analysis.breakout_strength}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stop Loss Analysis */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-bearish" />
                Stop Loss
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-sm font-mono font-medium text-bearish">
                    {formatPrice(selectedSignal.sl_analysis?.sl_price || selectedSignal.stop_loss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {selectedSignal.sl_analysis?.sl_type || 'atr'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pips</span>
                  <span className="text-sm font-mono text-foreground">
                    {selectedSignal.sl_analysis?.pip_distance?.toFixed(1) || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk</span>
                  <span className="text-sm font-mono text-bearish">
                    {selectedSignal.sl_analysis?.percentage_risk?.toFixed(2) || '-'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Take Profit Analysis */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-bullish" />
                Take Profit Targets
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'TP1', data: selectedSignal.tp_analysis?.tp1, price: selectedSignal.take_profit.tp1 },
                  { label: 'TP2', data: selectedSignal.tp_analysis?.tp2, price: selectedSignal.take_profit.tp2 },
                  { label: 'TP3', data: selectedSignal.tp_analysis?.tp3, price: selectedSignal.take_profit.tp3 },
                ].map((tp, i) => (
                  <div key={tp.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        "bg-bullish/20 text-bullish"
                      )} style={{ opacity: 1 - i * 0.2 }}>
                        {tp.label}
                      </span>
                      <div>
                        <p className="text-sm font-mono font-medium text-bullish">
                          {formatPrice(tp.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          1:{tp.data?.ratio || (i + 1)} R:R
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="p-4 space-y-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Position Size Calculator
              </h3>
              
              {/* Account Balance */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Account Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(Number(e.target.value))}
                      className="w-full bg-muted border border-border rounded-lg px-8 py-3 text-lg font-mono text-foreground"
                    />
                  </div>
                </div>

                {/* Risk Percent */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Risk Percentage
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setRiskPercent(pct)}
                        className={cn(
                          "flex-1 py-3 rounded-lg font-medium transition-all",
                          riskPercent === pct
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signal Info */}
                {selectedSignal && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Symbol</span>
                      <span className="font-medium text-foreground">{selectedSignal.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="font-mono text-foreground">{formatPrice(selectedSignal.current_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stop Loss</span>
                      <span className="font-mono text-bearish">{formatPrice(selectedSignal.stop_loss)}</span>
                    </div>
                  </div>
                )}

                {/* Results */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk Amount</span>
                    <span className="text-lg font-mono font-bold text-bearish">
                      ${positionCalc.riskAmount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">SL Distance (Pips)</span>
                    <span className="text-lg font-mono font-bold text-foreground">
                      {positionCalc.pipValue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium text-primary">Lot Size</span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      {positionCalc.lotSize}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* R:R Ratio */}
            {selectedSignal && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Risk : Reward</h3>
                <div className={cn(
                  "text-center py-4 rounded-lg",
                  selectedSignal.risk_reward_ratio >= 1.5 
                    ? "bg-bullish/10" 
                    : "bg-bearish/10"
                )}>
                  <span className={cn(
                    "text-3xl font-bold",
                    selectedSignal.risk_reward_ratio >= 1.5 
                      ? "text-bullish" 
                      : "text-bearish"
                  )}>
                    1 : {selectedSignal.risk_reward_ratio}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Signal Detail Sheet */}
      {showSignalDetail && selectedSignal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 bg-background rounded-t-3xl border-t border-border max-h-[85vh] overflow-auto safe-area-bottom">
            {/* Handle */}
            <div className="sticky top-0 bg-background pt-3 pb-2 px-4 border-b border-border">
              <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedSignal.symbol}</h2>
                  <p className="text-sm text-muted-foreground">{selectedSignal.timeframe} Signal</p>
                </div>
                <button 
                  onClick={() => setShowSignalDetail(false)}
                  className="p-2 rounded-full bg-muted"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Signal Badge */}
              <div className={cn(
                "p-4 rounded-xl text-center",
                selectedSignal.signal.includes('BUY') 
                  ? "bg-bullish/10 border border-bullish/30"
                  : selectedSignal.signal.includes('SELL')
                    ? "bg-bearish/10 border border-bearish/30"
                    : "bg-neutral/10 border border-neutral/30"
              )}>
                <div className={cn(
                  "text-2xl font-bold mb-1",
                  selectedSignal.signal.includes('BUY') ? "text-bullish" :
                  selectedSignal.signal.includes('SELL') ? "text-bearish" : "text-neutral"
                )}>
                  {selectedSignal.signal.replace('_', ' ')}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold text-accent">{selectedSignal.confidence}%</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    selectedSignal.strength === 'Very Strong' && "bg-primary/20 text-primary",
                    selectedSignal.strength === 'Strong' && "bg-bullish/20 text-bullish",
                    selectedSignal.strength === 'Moderate' && "bg-neutral/20 text-neutral",
                    selectedSignal.strength === 'Weak' && "bg-muted text-muted-foreground"
                  )}>
                    {selectedSignal.strength}
                  </span>
                </div>
              </div>

              {/* Price Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-info/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Entry Zone</p>
                  <p className="text-sm font-mono font-medium text-info">
                    {formatPrice(selectedSignal.entry_zone.low)}
                  </p>
                </div>
                <div className="bg-bearish/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                  <p className="text-sm font-mono font-medium text-bearish">
                    {formatPrice(selectedSignal.stop_loss)}
                  </p>
                </div>
                <div className="bg-bullish/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">R:R</p>
                  <p className="text-sm font-mono font-medium text-bullish">
                    1:{selectedSignal.risk_reward_ratio}
                  </p>
                </div>
              </div>

              {/* Take Profit Levels */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Take Profit Levels</h3>
                <div className="space-y-2">
                  {[
                    { label: 'TP1', price: selectedSignal.take_profit.tp1, ratio: 1 },
                    { label: 'TP2', price: selectedSignal.take_profit.tp2, ratio: 2 },
                    { label: 'TP3', price: selectedSignal.take_profit.tp3, ratio: 3 },
                  ].map((tp) => (
                    <div key={tp.label} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-bullish/20 text-bullish flex items-center justify-center text-sm font-bold">
                          {tp.label}
                        </span>
                        <span className="text-sm font-mono font-medium text-foreground">
                          {formatPrice(tp.price)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">1:{tp.ratio} R:R</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Signal Reasons</h3>
                <div className="space-y-1">
                  {selectedSignal.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowSignalDetail(false)
                    setActiveTab('chart')
                  }}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium"
                >
                  View Chart
                </button>
                <button 
                  onClick={() => {
                    setShowSignalDetail(false)
                    setActiveTab('calculator')
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  Calculate Size
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {[
            { id: 'signals' as Tab, icon: BarChart3, label: 'Signals' },
            { id: 'chart' as Tab, icon: LineChart, label: 'Chart' },
            { id: 'analysis' as Tab, icon: Target, label: 'Analysis' },
            { id: 'calculator' as Tab, icon: Calculator, label: 'Calc' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-colors",
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Mobile Signal Card Component
function MobileSignalCard({ signal, onTap, isActive }: { signal: Signal; onTap: () => void; isActive: boolean }) {
  const isBullish = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY'
  const isBearish = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL'

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  return (
    <div
      onClick={onTap}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98]",
        isActive 
          ? "bg-primary/10 border-primary" 
          : "bg-card border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isBullish ? "bg-bullish/20" : isBearish ? "bg-bearish/20" : "bg-neutral/20"
        )}>
          {isBullish && <TrendingUp className="w-5 h-5 text-bullish" />}
          {isBearish && <TrendingDown className="w-5 h-5 text-bearish" />}
          {!isBullish && !isBearish && <Minus className="w-5 h-5 text-neutral" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{signal.symbol}</h3>
            <span className={cn(
              "text-xs font-bold uppercase px-1.5 py-0.5 rounded",
              isBullish && "bg-bullish/20 text-bullish",
              isBearish && "bg-bearish/20 text-bearish",
              !isBullish && !isBearish && "bg-neutral/20 text-neutral"
            )}>
              {signal.signal.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{signal.timeframe}</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-mono font-bold text-foreground">
          {formatPrice(signal.current_price)}
        </p>
        <div className="flex items-center gap-1 justify-end">
          <Award className="w-3 h-3 text-accent" />
          <span className="text-sm font-medium text-accent">{signal.confidence}%</span>
        </div>
      </div>
    </div>
  )
}
