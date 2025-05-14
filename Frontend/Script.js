const symbol = "BTCUSDT";
let timeframe = "1D";
let indicator1 = "EMA";
let indicator2 = "RSI";

// DOM Elements
document.getElementById('modeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
}
const select1 = document.getElementById("indicator1");
const select2 = document.getElementById("indicator2");
const tfSelect = document.getElementById("timeframe");
const result1 = document.getElementById("result1");
const result2 = document.getElementById("result2");
const predictionBox = document.getElementById("prediction");

// Handlers
select1.addEventListener("change", () => {
  indicator1 = select1.value;
  fetchData();
});
select2.addEventListener("change", () => {
  indicator2 = select2.value;
  fetchData();
});
tfSelect.addEventListener("change", () => {
  timeframe = tfSelect.value;
  fetchData();
});

async function fetchData() {
  try {
    const interval = timeframe.replace("D", "1D").replace("H", "") + "0";
    const res = await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=100`);
    const json = await res.json();

    const candles = json.result.list
      .map(c => ({
        time: parseInt(c[0]),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
        volume: parseFloat(c[5])
      }))
      .reverse();

    const closes = candles.map(c => c.close);
    updateIndicators(closes);
    runRegression(closes.slice(-12));
  } catch (e) {
    console.error("Error fetching data", e);
  }
}

// Technical Indicator Calculations
function calculateEMA(closes, period = 14) {
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema.toFixed(2);
}

function calculateRSI(closes, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    let diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  const rsi = 100 - 100 / (1 + rs);
  return rsi.toFixed(2);
}

function detectCrossover(closes) {
  const short = calculateEMA(closes.slice(-20), 5);
  const long = calculateEMA(closes.slice(-20), 20);
  return parseFloat(short) > parseFloat(long) ? "Bullish Crossover" : "Bearish Crossover";
}

// Regression Prediction
function runRegression(lastCloses) {
  const n = lastCloses.length;
  const x = [...Array(n).keys()];
  const y = lastCloses;

  const xSum = x.reduce((a, b) => a + b);
  const ySum = y.reduce((a, b) => a + b);
  const xSqSum = x.reduce((a, b) => a + b ** 2, 0);
  const xySum = x.reduce((sum, xi, i) => sum + xi * y[i], 0);

  const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum ** 2);
  const intercept = (ySum - slope * xSum) / n;

  const predicted = slope * n + intercept;
  predictionBox.innerText = `Predicted Next Price: $${predicted.toFixed(2)}`;
}

// UI Update
function updateIndicators(closes) {
  result1.innerText = runIndicator(indicator1, closes);
  result2.innerText = runIndicator(indicator2, closes);
}

function runIndicator(indicator, closes) {
  switch (indicator) {
    case "EMA": return `EMA(14): ${calculateEMA(closes)}`;
    case "RSI": return `RSI(14): ${calculateRSI(closes)}`;
    case "CROSS": return detectCrossover(closes);
    default: return "N/A";
  }
}

fetchData();