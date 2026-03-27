import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [cryptoRes, forexRes] = await Promise.all([
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 30 } }
      ),
      fetch(
        'https://api.twelvedata.com/price?symbol=EUR/USD,GBP/USD,USD/JPY,AUD/USD,USD/CAD,USD/CHF&apikey=cfb4e9be899c4fdc8bcd7aafe9e0ec15',
        { next: { revalidate: 30 } }
      )
    ])

    const crypto = await cryptoRes.json()
    const forex = await forexRes.json()

    return NextResponse.json({ crypto, forex })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
