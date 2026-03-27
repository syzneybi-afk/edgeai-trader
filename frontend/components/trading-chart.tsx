'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, type IChartApi, type ISeriesApi, ColorType, CrosshairMode } from 'lightweight-charts'
import { cn } from '@/lib/utils'
import type { Signal, Timeframe } from '@/lib/types'

interface TradingChartProps {
  data: {
    time: number
    open: number
    high: number
    low: number
    close: number
  }[]
  signal?: Signal | null
  timeframe: Timeframe
  onTimeframeChange: (tf: Timeframe) => void
  height?: number
}

const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1']

export function TradingChart({ data, signal, timeframe, onTimeframeChange, height = 500 }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [crosshairData, setCrosshairData] = useState<{
    time: string
    open: number
    high: number
    low: number
    close: number
  } | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.6)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgba(30, 41, 59, 0.9)',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgba(30, 41, 59, 0.9)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const candleData = param.seriesData.get(candlestickSeries)
        if (candleData && 'open' in candleData) {
          const date = new Date(Number(param.time) * 1000)
          setCrosshairData({
            time: date.toLocaleString(),
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
          })
        }
      } else {
        setCrosshairData(null)
      }
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [height])

  // Update data
  useEffect(() => {
    if (!candlestickSeriesRef.current || data.length === 0) return

    const formattedData = data.map(d => ({
      time: Math.floor(d.time / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    candlestickSeriesRef.current.setData(formattedData)

    // Add price lines for signal levels
    if (signal && chartRef.current) {
      // Clear existing price lines
      candlestickSeriesRef.current.createPriceLine({
        price: signal.entry_zone.low,
        color: 'rgba(59, 130, 246, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry Low',
      })

      candlestickSeriesRef.current.createPriceLine({
        price: signal.entry_zone.high,
        color: 'rgba(59, 130, 246, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry High',
      })

      candlestickSeriesRef.current.createPriceLine({
        price: signal.stop_loss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      })

      candlestickSeriesRef.current.createPriceLine({
        price: signal.take_profit.tp1,
        color: 'rgba(34, 197, 94, 0.8)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP1',
      })

      candlestickSeriesRef.current.createPriceLine({
        price: signal.take_profit.tp2,
        color: 'rgba(34, 197, 94, 0.6)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP2',
      })

      candlestickSeriesRef.current.createPriceLine({
        price: signal.take_profit.tp3,
        color: 'rgba(34, 197, 94, 0.4)',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP3',
      })
    }

    // Fit content
    chartRef.current?.timeScale().fitContent()
  }, [data, signal])

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(5)
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                timeframe === tf
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {/* OHLC Display */}
        {crosshairData && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-muted-foreground">{crosshairData.time}</span>
            <span>O: <span className="text-foreground">{formatPrice(crosshairData.open)}</span></span>
            <span>H: <span className="text-bullish">{formatPrice(crosshairData.high)}</span></span>
            <span>L: <span className="text-bearish">{formatPrice(crosshairData.low)}</span></span>
            <span>C: <span className={cn(
              crosshairData.close >= crosshairData.open ? "text-bullish" : "text-bearish"
            )}>{formatPrice(crosshairData.close)}</span></span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} />

      {/* Signal Legend */}
      {signal && (
        <div className="flex items-center gap-4 p-3 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-info" />
            <span className="text-muted-foreground">Entry Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-bearish" />
            <span className="text-muted-foreground">Stop Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-bullish" />
            <span className="text-muted-foreground">Take Profit</span>
          </div>
        </div>
      )}
    </div>
  )
}
