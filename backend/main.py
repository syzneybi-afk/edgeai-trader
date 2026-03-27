import fastapi
import fastapi.middleware.cors
from pydantic import BaseModel
from typing import Optional
import math
import os
import httpx
from datetime import datetime

app = fastapi.FastAPI(title="EdgeAI Trader API", version="1.0.0")

# API Keys from environment variables
TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", "")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")

# Forex pairs supported by Twelve Data
FOREX_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF", "EUR/GBP"]

# Crypto IDs for CoinGecko
CRYPTO_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "BNB": "binancecoin",
    "XRP": "ripple"
}

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class OHLCVData(BaseModel):
    timestamp: list[int]
    open: list[float]
    high: list[float]
    low: list[float]
    close: list[float]
    volume: list[float]


class IndicatorRequest(BaseModel):
    ohlcv: OHLCVData
    rsi_period: int = 14
    macd_fast: int = 12
    macd_slow: int = 26
    macd_signal: int = 9
    ema_periods: list[int] = [9, 21, 50, 200]


class SupportResistanceRequest(BaseModel):
    ohlcv: OHLCVData
    lookback: int = 20
    num_levels: int = 5


class SignalRequest(BaseModel):
    ohlcv: OHLCVData
    symbol: str
    timeframe: str


# Technical Indicator Calculations
def calculate_ema(prices: list[float], period: int) -> list[float]:
    """Calculate Exponential Moving Average"""
    if len(prices) < period:
        return [None] * len(prices)
    
    ema = []
    multiplier = 2 / (period + 1)
    
    # Start with SMA for the first EMA value
    sma = sum(prices[:period]) / period
    ema = [None] * (period - 1) + [sma]
    
    for i in range(period, len(prices)):
        ema_value = (prices[i] * multiplier) + (ema[-1] * (1 - multiplier))
        ema.append(ema_value)
    
    return ema


def calculate_rsi(prices: list[float], period: int = 14) -> list[float]:
    """Calculate Relative Strength Index"""
    if len(prices) < period + 1:
        return [None] * len(prices)
    
    rsi = [None] * period
    
    # Calculate price changes
    changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    
    # Separate gains and losses
    gains = [max(0, c) for c in changes]
    losses = [abs(min(0, c)) for c in changes]
    
    # Initial average gain/loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    # First RSI value
    if avg_loss == 0:
        rsi.append(100)
    else:
        rs = avg_gain / avg_loss
        rsi.append(100 - (100 / (1 + rs)))
    
    # Subsequent RSI values using smoothed averages
    for i in range(period, len(changes)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        if avg_loss == 0:
            rsi.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi.append(100 - (100 / (1 + rs)))
    
    return rsi


def calculate_macd(prices: list[float], fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    """Calculate MACD, Signal line, and Histogram"""
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    # MACD line = Fast EMA - Slow EMA
    macd_line = []
    for i in range(len(prices)):
        if ema_fast[i] is not None and ema_slow[i] is not None:
            macd_line.append(ema_fast[i] - ema_slow[i])
        else:
            macd_line.append(None)
    
    # Filter out None values for signal calculation
    macd_values = [v for v in macd_line if v is not None]
    signal_line_values = calculate_ema(macd_values, signal) if len(macd_values) >= signal else []
    
    # Reconstruct signal line with proper alignment
    signal_line = [None] * (len(macd_line) - len(signal_line_values)) + signal_line_values
    
    # Histogram = MACD - Signal
    histogram = []
    for i in range(len(macd_line)):
        if macd_line[i] is not None and signal_line[i] is not None:
            histogram.append(macd_line[i] - signal_line[i])
        else:
            histogram.append(None)
    
    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram
    }


def calculate_support_resistance(highs: list[float], lows: list[float], closes: list[float], lookback: int = 20, num_levels: int = 5) -> dict:
    """Calculate support and resistance levels using pivot points and price clusters"""
    if len(highs) < lookback:
        return {"support": [], "resistance": []}
    
    # Find local minima (support) and maxima (resistance)
    support_levels = []
    resistance_levels = []
    
    for i in range(lookback, len(highs) - lookback):
        # Check for local maximum (resistance)
        is_resistance = True
        for j in range(1, lookback + 1):
            if highs[i] <= highs[i - j] or highs[i] <= highs[i + j]:
                is_resistance = False
                break
        if is_resistance:
            resistance_levels.append(highs[i])
        
        # Check for local minimum (support)
        is_support = True
        for j in range(1, lookback + 1):
            if lows[i] >= lows[i - j] or lows[i] >= lows[i + j]:
                is_support = False
                break
        if is_support:
            support_levels.append(lows[i])
    
    # Cluster nearby levels and take the most significant ones
    def cluster_levels(levels: list[float], threshold: float = 0.002) -> list[float]:
        if not levels:
            return []
        sorted_levels = sorted(levels)
        clustered = []
        current_cluster = [sorted_levels[0]]
        
        for level in sorted_levels[1:]:
            if abs(level - current_cluster[-1]) / current_cluster[-1] < threshold:
                current_cluster.append(level)
            else:
                clustered.append(sum(current_cluster) / len(current_cluster))
                current_cluster = [level]
        clustered.append(sum(current_cluster) / len(current_cluster))
        
        return clustered[-num_levels:] if len(clustered) > num_levels else clustered
    
    # Add current price context
    current_price = closes[-1] if closes else 0
    
    support = cluster_levels(support_levels)
    resistance = cluster_levels(resistance_levels)
    
    # Filter support below current price, resistance above
    support = [s for s in support if s < current_price]
    resistance = [r for r in resistance if r > current_price]
    
    return {
        "support": sorted(support, reverse=True)[:num_levels],
        "resistance": sorted(resistance)[:num_levels]
    }


def calculate_signal_strength(rsi: float, macd_hist: float, price: float, ema_9: float, ema_21: float) -> dict:
    """Calculate trading signal based on multiple indicators"""
    score = 50  # Neutral starting point
    reasons = []
    
    # RSI analysis
    if rsi is not None:
        if rsi < 30:
            score += 15
            reasons.append("RSI oversold")
        elif rsi > 70:
            score -= 15
            reasons.append("RSI overbought")
        elif rsi < 45:
            score += 5
            reasons.append("RSI bullish zone")
        elif rsi > 55:
            score -= 5
            reasons.append("RSI bearish zone")
    
    # MACD analysis
    if macd_hist is not None:
        if macd_hist > 0:
            score += 10
            reasons.append("MACD bullish")
        else:
            score -= 10
            reasons.append("MACD bearish")
    
    # EMA crossover analysis
    if ema_9 is not None and ema_21 is not None:
        if ema_9 > ema_21:
            score += 15
            reasons.append("EMA bullish crossover")
        else:
            score -= 15
            reasons.append("EMA bearish crossover")
        
        # Price relative to EMAs
        if price > ema_9 > ema_21:
            score += 10
            reasons.append("Strong uptrend")
        elif price < ema_9 < ema_21:
            score -= 10
            reasons.append("Strong downtrend")
    
    # Determine signal
    if score >= 70:
        signal = "STRONG_BUY"
        strength = "Very Strong"
    elif score >= 60:
        signal = "BUY"
        strength = "Strong"
    elif score >= 55:
        signal = "BUY"
        strength = "Moderate"
    elif score <= 30:
        signal = "STRONG_SELL"
        strength = "Very Strong"
    elif score <= 40:
        signal = "SELL"
        strength = "Strong"
    elif score <= 45:
        signal = "SELL"
        strength = "Moderate"
    else:
        signal = "NEUTRAL"
        strength = "Weak"
    
    return {
        "signal": signal,
        "strength": strength,
        "confidence": min(100, max(0, score)),
        "reasons": reasons
    }


# API Endpoints
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "EdgeAI Trader API"}


@app.post("/indicators")
async def calculate_indicators(request: IndicatorRequest) -> dict:
    """Calculate all technical indicators for given OHLCV data"""
    prices = request.ohlcv.close
    
    # Calculate EMAs
    emas = {}
    for period in request.ema_periods:
        emas[f"ema_{period}"] = calculate_ema(prices, period)
    
    # Calculate RSI
    rsi = calculate_rsi(prices, request.rsi_period)
    
    # Calculate MACD
    macd = calculate_macd(prices, request.macd_fast, request.macd_slow, request.macd_signal)
    
    # Calculate Support/Resistance
    sr_levels = calculate_support_resistance(
        request.ohlcv.high,
        request.ohlcv.low,
        request.ohlcv.close,
        lookback=20,
        num_levels=5
    )
    
    return {
        "ema": emas,
        "rsi": rsi,
        "macd": macd,
        "support_resistance": sr_levels,
        "data_points": len(prices)
    }


@app.post("/support-resistance")
async def get_support_resistance(request: SupportResistanceRequest) -> dict:
    """Calculate support and resistance levels"""
    return calculate_support_resistance(
        request.ohlcv.high,
        request.ohlcv.low,
        request.ohlcv.close,
        request.lookback,
        request.num_levels
    )


def detect_entry_type(prices: list[float], highs: list[float], lows: list[float], atr_value: float) -> dict:
    """Detect the optimal entry type based on price action"""
    if len(prices) < 10:
        return {"entry_type": "immediate", "reason": "Insufficient data for analysis"}
    
    current = prices[-1]
    recent_high = max(highs[-10:])
    recent_low = min(lows[-10:])
    range_size = recent_high - recent_low
    
    # Check for breakout
    if current > recent_high:
        return {
            "entry_type": "breakout",
            "reason": f"Price broke above resistance at {round(recent_high, 5)}",
            "confirmations": ["Breakout above range", "New high formed"]
        }
    elif current < recent_low:
        return {
            "entry_type": "breakout",
            "reason": f"Price broke below support at {round(recent_low, 5)}",
            "confirmations": ["Breakdown below range", "New low formed"]
        }
    
    # Check for pullback opportunity
    mid_range = (recent_high + recent_low) / 2
    if abs(current - mid_range) < atr_value * 0.3:
        return {
            "entry_type": "pullback",
            "reason": "Price retraced to mid-range zone - optimal pullback entry",
            "confirmations": ["Mean reversion setup", "Price consolidating"]
        }
    
    # Check for retest
    if abs(current - recent_high) < atr_value * 0.5 or abs(current - recent_low) < atr_value * 0.5:
        return {
            "entry_type": "retest",
            "reason": "Price retesting key level",
            "confirmations": ["Level retest in progress", "Waiting for confirmation"]
        }
    
    return {
        "entry_type": "immediate",
        "reason": "Momentum entry with indicator alignment",
        "confirmations": ["Indicators aligned", "Trend continuation"]
    }


def analyze_breakout(highs: list[float], lows: list[float], closes: list[float], atr_value: float) -> dict:
    """Analyze breakout conditions"""
    if len(closes) < 20:
        return {"is_breakout": False, "breakout_type": "none"}
    
    lookback = 10
    range_high = max(highs[-lookback:])
    range_low = min(lows[-lookback:])
    current = closes[-1]
    
    # Determine breakout
    is_bullish_breakout = current > range_high
    is_bearish_breakout = current < range_low
    
    # Calculate breakout strength (0-100)
    if is_bullish_breakout:
        breakout_distance = current - range_high
        strength = min(100, int((breakout_distance / atr_value) * 50 + 50))
        breakout_type = "bullish"
        retest_zone = {"low": range_high - atr_value * 0.2, "high": range_high + atr_value * 0.3}
    elif is_bearish_breakout:
        breakout_distance = range_low - current
        strength = min(100, int((breakout_distance / atr_value) * 50 + 50))
        breakout_type = "bearish"
        retest_zone = {"low": range_low - atr_value * 0.3, "high": range_low + atr_value * 0.2}
    else:
        strength = 30
        breakout_type = "none"
        retest_zone = None
    
    return {
        "is_breakout": is_bullish_breakout or is_bearish_breakout,
        "breakout_type": breakout_type,
        "breakout_level": round(range_high if is_bullish_breakout else range_low, 5),
        "breakout_strength": strength,
        "consolidation_range": {
            "high": round(range_high, 5),
            "low": round(range_low, 5)
        },
        "retest_zone": {
            "low": round(retest_zone["low"], 5),
            "high": round(retest_zone["high"], 5)
        } if retest_zone else None,
        "volume_confirmation": strength > 60
    }


def analyze_stop_loss(price: float, atr: float, is_bullish: bool, support: list, resistance: list) -> dict:
    """Analyze optimal stop loss placement"""
    if is_bullish:
        if support:
            sl_price = support[0] - atr * 0.3
            sl_type = "structure"
            sl_reason = f"Below support at {round(support[0], 5)} with ATR buffer"
        else:
            sl_price = price - atr * 2
            sl_type = "atr"
            sl_reason = "2x ATR below entry for volatility protection"
        invalidation = price - atr * 2.5
    else:
        if resistance:
            sl_price = resistance[0] + atr * 0.3
            sl_type = "structure"
            sl_reason = f"Above resistance at {round(resistance[0], 5)} with ATR buffer"
        else:
            sl_price = price + atr * 2
            sl_type = "atr"
            sl_reason = "2x ATR above entry for volatility protection"
        invalidation = price + atr * 2.5
    
    pip_distance = abs(price - sl_price) * (1 if price > 100 else 10000)
    pct_risk = abs((sl_price - price) / price) * 100
    
    return {
        "sl_price": round(sl_price, 5),
        "sl_type": sl_type,
        "sl_reason": sl_reason,
        "pip_distance": round(pip_distance, 1),
        "percentage_risk": round(pct_risk, 2),
        "invalidation_level": round(invalidation, 5)
    }


def analyze_take_profit(price: float, atr: float, is_bullish: bool) -> dict:
    """Analyze take profit targets"""
    if is_bullish:
        tp1 = price + atr
        tp2 = price + atr * 2
        tp3 = price + atr * 3
    else:
        tp1 = price - atr
        tp2 = price - atr * 2
        tp3 = price - atr * 3
    
    return {
        "tp1": {
            "price": round(tp1, 5),
            "ratio": 1.0,
            "reason": f"1:1 R:R - Conservative target at {round(tp1, 5)}"
        },
        "tp2": {
            "price": round(tp2, 5),
            "ratio": 2.0,
            "reason": f"1:2 R:R - Standard target at {round(tp2, 5)}"
        },
        "tp3": {
            "price": round(tp3, 5),
            "ratio": 3.0,
            "reason": f"1:3 R:R - Extended target at {round(tp3, 5)}"
        },
        "trailing_stop_trigger": round(tp1, 5)
    }


@app.post("/signal")
async def generate_signal(request: SignalRequest) -> dict:
    """Generate trading signal for a symbol with full analysis"""
    prices = request.ohlcv.close
    highs = request.ohlcv.high
    lows = request.ohlcv.low
    
    # Calculate indicators
    rsi = calculate_rsi(prices, 14)
    macd = calculate_macd(prices, 12, 26, 9)
    ema_9 = calculate_ema(prices, 9)
    ema_21 = calculate_ema(prices, 21)
    
    # Get latest values
    current_price = prices[-1] if prices else 0
    current_rsi = rsi[-1] if rsi and rsi[-1] is not None else None
    current_macd_hist = macd["histogram"][-1] if macd["histogram"] and macd["histogram"][-1] is not None else None
    current_ema_9 = ema_9[-1] if ema_9 and ema_9[-1] is not None else None
    current_ema_21 = ema_21[-1] if ema_21 and ema_21[-1] is not None else None
    
    # Calculate signal
    signal_data = calculate_signal_strength(
        current_rsi,
        current_macd_hist,
        current_price,
        current_ema_9,
        current_ema_21
    )
    
    # Calculate support/resistance
    sr = calculate_support_resistance(highs, lows, prices)
    
    # Calculate ATR
    atr = calculate_atr(highs, lows, prices)
    current_atr = atr[-1] if atr and atr[-1] is not None else current_price * 0.01
    
    is_bullish = signal_data["signal"] in ["BUY", "STRONG_BUY"]
    
    # Entry analysis
    entry_info = detect_entry_type(prices, highs, lows, current_atr)
    entry_zone = {
        "low": current_price - (current_atr * 0.5) if is_bullish else current_price - (current_atr * 0.3),
        "high": current_price + (current_atr * 0.3) if is_bullish else current_price + (current_atr * 0.5),
        "optimal": current_price - (current_atr * 0.1) if is_bullish else current_price + (current_atr * 0.1)
    }
    
    # Breakout analysis
    breakout_analysis = analyze_breakout(highs, lows, prices, current_atr)
    
    # Stop loss analysis
    sl_analysis = analyze_stop_loss(current_price, current_atr, is_bullish, sr["support"], sr["resistance"])
    
    # Take profit analysis
    tp_analysis = analyze_take_profit(current_price, current_atr, is_bullish)
    
    # Calculate risk/reward
    risk = abs(current_price - sl_analysis["sl_price"])
    reward = abs(tp_analysis["tp2"]["price"] - current_price)
    rr_ratio = round(reward / risk, 2) if risk > 0 else 0
    
    return {
        "symbol": request.symbol,
        "timeframe": request.timeframe,
        "current_price": round(current_price, 5),
        "signal": signal_data["signal"],
        "strength": signal_data["strength"],
        "confidence": signal_data["confidence"],
        "reasons": signal_data["reasons"],
        "entry_zone": {
            "low": round(entry_zone["low"], 5),
            "high": round(entry_zone["high"], 5)
        },
        "stop_loss": sl_analysis["sl_price"],
        "take_profit": {
            "tp1": tp_analysis["tp1"]["price"],
            "tp2": tp_analysis["tp2"]["price"],
            "tp3": tp_analysis["tp3"]["price"]
        },
        "risk_reward_ratio": rr_ratio,
        "indicators": {
            "rsi": round(current_rsi, 2) if current_rsi is not None else None,
            "macd_histogram": round(current_macd_hist, 6) if current_macd_hist is not None else None,
            "ema_9": round(current_ema_9, 5) if current_ema_9 is not None else None,
            "ema_21": round(current_ema_21, 5) if current_ema_21 is not None else None
        },
        "support_resistance": sr,
        # Enhanced analysis
        "entry_analysis": {
            "entry_type": entry_info["entry_type"],
            "entry_zone": {
                "low": round(entry_zone["low"], 5),
                "high": round(entry_zone["high"], 5),
                "optimal": round(entry_zone["optimal"], 5)
            },
            "entry_reason": entry_info["reason"],
            "entry_confirmation": entry_info.get("confirmations", [])
        },
        "breakout_analysis": breakout_analysis,
        "sl_analysis": sl_analysis,
        "tp_analysis": tp_analysis
    }


def calculate_atr(highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> list[float]:
    """Calculate Average True Range"""
    if len(highs) < 2:
        return [None] * len(highs)
    
    tr = [highs[0] - lows[0]]  # First TR is just high - low
    
    for i in range(1, len(highs)):
        high_low = highs[i] - lows[i]
        high_close = abs(highs[i] - closes[i-1])
        low_close = abs(lows[i] - closes[i-1])
        tr.append(max(high_low, high_close, low_close))
    
    # Calculate ATR as EMA of TR
    atr = calculate_ema(tr, period)
    return atr


@app.post("/breakout-zones")
async def detect_breakout_zones(request: IndicatorRequest) -> dict:
    """Detect consolidation and potential breakout zones"""
    highs = request.ohlcv.high
    lows = request.ohlcv.low
    closes = request.ohlcv.close
    
    if len(closes) < 20:
        return {"zones": [], "message": "Insufficient data"}
    
    # Calculate ATR for volatility
    atr = calculate_atr(highs, lows, closes)
    current_atr = atr[-1] if atr[-1] is not None else (highs[-1] - lows[-1])
    
    # Find consolidation (low volatility periods)
    lookback = 10
    recent_highs = highs[-lookback:]
    recent_lows = lows[-lookback:]
    
    range_high = max(recent_highs)
    range_low = min(recent_lows)
    range_size = range_high - range_low
    
    # Determine if in consolidation
    avg_range = sum([highs[i] - lows[i] for i in range(-lookback, 0)]) / lookback
    is_consolidating = range_size < (avg_range * 3)
    
    current_price = closes[-1]
    
    # Determine breakout type
    if current_price > range_high:
        breakout_type = "Bullish Breakout"
        momentum_score = min(100, int(((current_price - range_high) / current_atr) * 50 + 50))
    elif current_price < range_low:
        breakout_type = "Bearish Breakdown"
        momentum_score = min(100, int(((range_low - current_price) / current_atr) * 50 + 50))
    else:
        breakout_type = "In Range"
        momentum_score = 50
    
    return {
        "consolidation": {
            "is_consolidating": is_consolidating,
            "range_high": round(range_high, 5),
            "range_low": round(range_low, 5),
            "range_size": round(range_size, 5)
        },
        "breakout": {
            "type": breakout_type,
            "momentum_score": momentum_score,
            "upper_boundary": round(range_high + (current_atr * 0.5), 5),
            "lower_boundary": round(range_low - (current_atr * 0.5), 5)
        },
        "retest_level": round(range_high if breakout_type == "Bullish Breakout" else range_low, 5) if breakout_type != "In Range" else None
    }


@app.post("/position-size")
async def calculate_position_size(
    account_balance: float,
    risk_percentage: float,
    entry_price: float,
    stop_loss: float,
    pip_value: float = 10.0
) -> dict:
    """Calculate position size based on risk management"""
    risk_amount = account_balance * (risk_percentage / 100)
    pip_risk = abs(entry_price - stop_loss) * 10000  # Convert to pips
    
    if pip_risk == 0:
        return {"error": "Invalid stop loss"}
    
    lot_size = risk_amount / (pip_risk * pip_value)
    potential_profit_1r = risk_amount
    potential_profit_2r = risk_amount * 2
    potential_profit_3r = risk_amount * 3
    
    return {
        "lot_size": round(lot_size, 2),
        "risk_amount": round(risk_amount, 2),
        "pip_risk": round(pip_risk, 1),
        "potential_profit": {
            "1r": round(potential_profit_1r, 2),
            "2r": round(potential_profit_2r, 2),
            "3r": round(potential_profit_3r, 2)
        }
    }
