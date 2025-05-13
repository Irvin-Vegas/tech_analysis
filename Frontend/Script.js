// script.js
const output = document.getElementById('output');
const pairSelector = document.getElementById('pairSelector');

async function getPrice(pair) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
  const data = await res.json();
  return parseFloat(data.price);
}

function calculateRSI(prices) {
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function predictPrice(prices) {
  const n = prices.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return slope * n + intercept;
}

async function updateDashboard() {
  const pair = pairSelector.value;
  const prices = [];
  for (let i = 0; i < 14; i++) {
    const price = await getPrice(pair);
    prices.push(price);
    await new Promise(r => setTimeout(r, 500));
  }

  const rsi = calculateRSI(prices);
  const prediction = predictPrice(prices);
  const current = prices[prices.length - 1];
  let alert = '';

  if (rsi > 70) alert = 'Overbought! Possible sell signal';
  else if (rsi < 30) alert = 'Oversold! Possible buy signal';

  output.innerHTML = `
    <p>Current Price: ${current.toFixed(2)}</p>
    <p>RSI: ${rsi.toFixed(2)}</p>
    <p>Next Price Prediction: ${prediction.toFixed(2)}</p>
    <p style="color:orange">Signal: ${alert}</p>
  `;
}

pairSelector.addEventListener('change', updateDashboard);
updateDashboard();
setInterval(updateDashboard, 60 * 60 * 1000);
