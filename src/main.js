import Chart from 'chart.js';
import resolveConfig from 'tailwindcss/resolveConfig'

const fullConfig = resolveConfig()
const form = document.getElementById('invest-form')
const regularAmount = document.getElementById('regular-amount')

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

regularAmount.addEventListener('change', changeRegularAmount)

function changeRegularAmount(e) {
  const formData = new FormData
  const data = JSON.parse(window.localStorage.getItem('invest_data'));
  Object.entries(data).forEach((arr) => { [key, value] = arr; formData.set(key, value) });
  data['regular_amount'] = e.target.value
  fetch('http://localhost:4567/invest', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment))
}

function processForm(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const store = {}
  data.forEach((value, key) => store[key] = value);
  data.set('years', 10)
  window.localStorage.setItem('invest_data', JSON.stringify(store));
  fetch('http://localhost:4567/invest', {
    method: 'POST',
    body: data,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment))
}

function renderChart(data) {
  const returns = data.returns.map(year => year.returns)
  const invested = data.invested
  const labels = data.returns.map(year => year.age)
  const chart = document.getElementById('myChart')
  const ctx = chart ? chart.getContext('2d') : null;

  regularAmount.setAttribute('min', data.regular.amount)
  regularAmount.setAttribute('max', data.regular.amount * 2)

  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted returns',
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