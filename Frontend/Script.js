const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  width: window.innerWidth,
  height: window.innerHeight,
  layout: { background: { color: '#000' }, textColor: '#fff' },
  grid: { vertLines: { color: '#444' }, horzLines: { color: '#444' } },
});

const candleSeries = chart.addCandlestickSeries();
const smaSeries = chart.addLineSeries({ color: 'yellow' });

async function fetchData() {
  const res = await fetch("https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=15&limit=100");
  const data = await res.json();

  const candles = data.result.list.map(item => ({
    time: Math.floor(item[0] / 1000),
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4])
  }));

  candleSeries.setData(candles);

  const closes = candles.map(c => c.close);
  const sma = window.technicalindicators.SMA.calculate({ period: 10, values: closes });

  const smaPoints = sma.map((val, i) => ({
    time: candles[i + 10 - 1].time,
    value: val
  }));

  smaSeries.setData(smaPoints);
}

fetchData();