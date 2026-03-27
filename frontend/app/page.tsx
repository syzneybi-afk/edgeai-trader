'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { SignalCard } from '@/components/signal-card'
import { MarketOverview } from '@/components/market-overview'
import { TradingChart } from '@/components/trading-chart'
import { IndicatorPanel } from '@/components/indicator-panel'
import { RiskCalculator } from '@/components/risk-calculator'
import { BestTrades } from '@/components/best-trades'
import { TradeAnalysis } from '@/components/trade-analysis'
import { mockInstruments, generateOHLCVData, generateLiveSignal, refreshLivePrices } from '@/lib/mock-data'
import type { MarketType, Timeframe, Signal, MarketInstrument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { BarChart3, Grid3X3, List, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const [marketFilter, setMarketFilter] = useState<MarketType>('all')
  const [instruments, setInstruments] = useState<MarketInstrument[]>(mockInstruments)
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument>(mockInstruments[0])
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('H1')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [signals, setSignals] = useState<Signal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Filter instruments by market type
  const filteredInstruments = useMemo(() => {
    if (marketFilter === 'all') return instruments
    return instruments.filter(i => i.category === marketFilter)
  }, [marketFilter, instruments])

  // Generate chart data for selected instrument
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

  // ── LIVE DATA REFRESH ──────────────────────────────────────
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch live prices
      const liveInstruments = await refreshLivePrices()
      setInstruments([...liveInstruments])

      // 2. Update selected instrument with new price
      const updatedSelected = liveInstruments.find(i => i.symbol === selectedInstrument.symbol)
      if (updatedSelected) setSelectedInstrument(updatedSelected)

      // 3. Generate real signals based on live data
      const newSignals = await Promise.all(
        liveInstruments
          .filter(i => marketFilter === 'all' || i.category === marketFilter)
          .map(instrument => generateLiveSignal(instrument, timeframe))
      )
      setSignals(newSignals)

      // 4. Update selected signal
      const updatedSignal = newSignals.find(s => s.symbol === selectedInstrument.symbol)
      if (updatedSignal) setSelectedSignal(updatedSignal)

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to refresh data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [marketFilter, timeframe, selectedInstrument.symbol])

  // Load live data on first render
  useEffect(() => {
    refreshData()
  }, [])

  // Re-generate signals when timeframe or market filter changes
  useEffect(() => {
    if (instruments.length > 0) {
      refreshData()
    }
  }, [timeframe, marketFilter])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  // Update selected signal when instrument changes
  useEffect(() => {
    const signal = signals.find(s => s.symbol === selectedInstrument.symbol)
    if (signal) setSelectedSignal(signal)
  }, [selectedInstrument, signals])

  const handleInstrumentSelect = (instrument: MarketInstrument) => {
    setSelectedInstrument(instrument)
  }

  const handleSignalSelect = (signal: Signal) => {
    setSelectedSignal(signal)
    const instrument = instruments.find(i => i.symbol === signal.symbol)
    if (instrument) setSelectedInstrument(instrument)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header marketFilter={marketFilter} onMarketFilterChange={setMarketFilter} />

      <main className="container mx-auto px-4 py-6 lg:px-6">

        {/* Live Status Bar */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500 animate-pulse"
            )} />
            <span>{isLoading ? 'Fetching live data...' : 'Live'}</span>
            {lastUpdated && (
              <span className="text-xs">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Top Section - Best Trades & Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <BestTrades signals={signals} onSelectSignal={handleSignalSelect} />
          </div>
          <div className="lg:col-span-2">
            <MarketOverview
              instruments={filteredInstruments}
              onSelect={handleInstrumentSelect}
              selectedSymbol={selectedInstrument.symbol}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="xl:col-span-3 space-y-6">
            {/* Selected Symbol Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedInstrument.symbol}</h2>
                <p className="text-sm text-muted-foreground">{selectedInstrument.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-2xl font-mono font-bold",
                  selectedInstrument.change >= 0 ? "text-bullish" : "text-bearish"
                )}>
                  {selectedInstrument.price >= 1000
                    ? selectedInstrument.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : selectedInstrument.price >= 1
                      ? selectedInstrument.price.toFixed(4)
                      : selectedInstrument.price.toFixed(5)
                  }
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  selectedInstrument.change >= 0
                    ? "bg-bullish/10 text-bullish"
                    : "bg-bearish/10 text-bearish"
                )}>
                  {selectedInstrument.changePercent >= 0 ? '+' : ''}{selectedInstrument.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Chart */}
            <TradingChart
              data={chartData}
              signal={selectedSignal}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              height={450}
            />

            {/* Signal Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Trading Signals
                  {signals.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({signals.filter(s => s.signal !== 'NEUTRAL').length} active)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === 'grid' ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === 'list' ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isLoading && signals.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading live signals...
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-3"
                )}>
                  {signals.slice(0, viewMode === 'grid' ? 6 : 10).map((signal) => (
                    <SignalCard
                      key={`${signal.symbol}-${signal.timeframe}`}
                      signal={signal}
                      onClick={() => handleSignalSelect(signal)}
                      isActive={selectedSignal?.symbol === signal.symbol}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {selectedSignal && <IndicatorPanel signal={selectedSignal} />}
            {selectedSignal && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2 px-1">
                  Trade Setup Analysis
                </h3>
                <TradeAnalysis signal={selectedSignal} />
              </div>
            )}
            <RiskCalculator signal={selectedSignal} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>EdgeAI Trader - AI-Powered Trading Signals</p>
            <p>Data for educational purposes only. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
