import Chart from 'chart.js';
import resolveConfig from 'tailwindcss/resolveConfig'

const fullConfig = resolveConfig()
const form = document.getElementById('invest-form')
const regularAmountSlider = document.getElementById('regular-amount')
const rateSlider = document.getElementById('rate')

if (form.length) {
  form.addEventListener('submit', processForm)
  const store = window.localStorage.getItem('invest_data')
  const data = JSON.parse(store)
  if (data) {
    Object.entries(data).forEach(field => {
      const [key, value] = field
      const input = form.querySelector(`[name='${key}']`)
      input.value = value
    })
   form.dispatchEvent(new Event('submit'))
  }
}

regularAmountSlider.addEventListener('change', refreshValues)
rateSlider.addEventListener('change', refreshValues)

function refreshValues(e) {
  const formData = new FormData(e.target.form)
  const data = JSON.parse(window.localStorage.getItem('invest_data'));
  Object.entries(data).forEach((arr) => { const [key, value] = arr; if (!formData.has(key)) formData.set(key, value) });
  fetch('http://localhost:4567/invest', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment, false))
}

function processForm(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const store = {}
  data.forEach((value, key) => store[key] = value);
  window.localStorage.setItem('invest_data', JSON.stringify(store));
  fetch('http://localhost:4567/invest', {
    method: 'POST',
    body: data,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment))
}

function renderChart(data, adjustSlider = true) {
  const returns = data.returns.map(year => year.returns)
  const invested = data.invested
  const labels = data.returns.map(year => year.age)
  const chart = document.getElementById('myChart')
  const ctx = chart ? chart.getContext('2d') : null;
  const years = document.getElementById('fix-years')

  if (adjustSlider) {
    let min = data.regular.amount
    let max = data.regular.amount * 3

    regularAmountSlider.setAttribute('min', min)
    document.querySelector('[data-regular-min]').innerText = min
    regularAmountSlider.setAttribute('max', max)
    document.querySelector('[data-regular-max]').innerText = max

    min = data.rate - 3
    max = data.rate + 3

    rateSlider.value = data.rate
    rateSlider.setAttribute('min', min)
    document.querySelector('[data-rate-min]').innerText = min
    rateSlider.setAttribute('max', max)
    document.querySelector('[data-rate-max]').innerText = max
  }

  document.getElementById('explanation').classList.remove('hidden')
  document.querySelector('[data-returns]').innerText = data.total_returns.toLocaleString('en')
  document.querySelector('[data-invested]').innerText = data.total_invested.toLocaleString('en')
  document.querySelector('[data-duration]').innerText = returns.length
  document.querySelector('[data-rate]').innerText = data.rate
  document.querySelector('[data-regular').innerText = data.regular.amount.toLocaleString('en')
  document.querySelector('[data-initial').innerText = data.initial.toLocaleString('en')
  document.querySelector('[data-retirement-age').innerText = data.returns[data.returns.length - 1].age
  years.value = data.returns.length

  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Estimated returns',
            data: returns,
            borderColor: fullConfig.theme.colors.green[500],
            backgroundColor: 'rgba(0, 0, 0, 0)',
          },
          {
            label: 'Invested',
            data: invested,
            borderColor: fullConfig.theme.colors.blue[400],
            backgroundColor: 'rgba(0, 0, 0, 0)',
          }
        ]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }
}