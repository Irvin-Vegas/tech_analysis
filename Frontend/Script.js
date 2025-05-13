document.addEventListener("DOMContentLoaded", function () {
  const chartContainer = document.getElementById("chart");

  const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: {
      background: { color: "#0d1117" },
      textColor: "#d1d4dc"
    },
    grid: {
      vertLines: { color: "#30363d" },
      horzLines: { color: "#30363d" }
    },
    priceScale: { borderColor: "#485c7b" },
    timeScale: { borderColor: "#485c7b" },
  });

  const candleSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
    borderVisible: false,
  });

  const smaSeries = chart.addLineSeries({
    color: "#fbc02d",
    lineWidth: 2,
  });

  let currentSymbol = "BTCUSDT";

  async function fetchCandles(symbol = "BTCUSDT") {
    try {
      const res = await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=60&limit=50`);
      const data = await res.json();
      const kline = data.result.list.reverse().map(i => ({
        time: Math.floor(i[0] / 1000),
        open: parseFloat(i[1]),
        high: parseFloat(i[2]),
        low: parseFloat(i[3]),
        close: parseFloat(i[4]),
      }));

      candleSeries.setData(kline);

      const sma = kline.map((d, i, arr) => {
        if (i < 4) return null;
        const avg = arr.slice(i - 4, i + 1).reduce((sum, c) => sum + c.close, 0) / 5;
        return { time: d.time, value: avg };
      }).filter(Boolean);

      smaSeries.setData(sma);

      checkAlerts(kline[kline.length - 1], sma[sma.length - 1]);
    } catch (e) {
      console.error("Error fetching candles", e);
    }
  }

  function checkAlerts(latestCandle, latestSMA) {
    if (!latestCandle || !latestSMA) return;

    if (latestCandle.close > latestSMA.value) {
      alert(`ALERT: Price crossed above SMA!\nClose: ${latestCandle.close.toFixed(2)} > SMA: ${latestSMA.value.toFixed(2)}`);
    } else if (latestCandle.close < latestSMA.value) {
      alert(`ALERT: Price crossed below SMA!\nClose: ${latestCandle.close.toFixed(2)} < SMA: ${latestSMA.value.toFixed(2)}`);
    }
  }

  document.getElementById("pairSelector").addEventListener("change", (e) => {
    currentSymbol = e.target.value;
    fetchCandles(currentSymbol);
  });

  fetchCandles(); // Initial fetch

  // Update every 60 minutes
  setInterval(() => fetchCandles(currentSymbol), 60 * 60 * 1000);
});
