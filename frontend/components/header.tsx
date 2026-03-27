'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { MarketType } from '@/lib/types'
import { Activity, BarChart3, Settings, Bell, Menu, X, Zap } from 'lucide-react'

interface HeaderProps {
  marketFilter: MarketType
  onMarketFilterChange: (filter: MarketType) => void
}

const MARKET_FILTERS: { value: MarketType; label: string }[] = [
  { value: 'all', label: 'All Markets' },
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'synthetic', label: 'Synthetic' },
]

export function Header({ marketFilter, onMarketFilterChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">EdgeAI Trader</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Trading Signals</p>
          </div>
        </div>

        {/* Market Filter - Desktop */}
        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          {MARKET_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onMarketFilterChange(filter.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                marketFilter === filter.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bullish/10 border border-bullish/20">
            <Activity className="w-3 h-3 text-bullish animate-pulse" />
            <span className="text-xs font-medium text-bullish">Live</span>
          </div>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            {MARKET_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  onMarketFilterChange(filter.value)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  marketFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
