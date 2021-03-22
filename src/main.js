import Chart from 'chart.js';
import resolveConfig from 'tailwindcss/resolveConfig'

const tailwindConfig = resolveConfig()
const form = document.getElementById('invest-form')
const regularAmount = document.getElementById('regular-amount')
const rateSlider = document.getElementById('rate')
const regularBoosts = document.querySelectorAll('[data-plus]')
const chart = document.getElementById('myChart')

const store = window.localStorage.getItem('invest_data')
const data = store ? JSON.parse(store) : null

if (data) {
  const formData = new FormData()
  Object.entries(data).forEach(field => {
    const [key, value] = field
    formData.set(key, value)
    if (form) {
      form.querySelector(`[name='${key}']`).value = value
    }
  })

  if (chart) populateChartWithData(formData)
}

if (form) form.addEventListener('submit', processForm)
if (rateSlider) rateSlider.addEventListener('change', refreshValues)

function populateChartWithData(data, adjustSlider = true) {
  fetch('http://localhost:4567/invest', {
    method: 'POST',
    body: data,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment, adjustSlider))
}

function refreshValues(e) {
  const formData = new FormData(e.target.form)
  Object.entries(data).forEach((arr) => { const [key, value] = arr; if (!formData.has(key)) formData.set(key, value) });
  populateChartWithData(formData, false)
}

function processForm(e) {
  const data = new FormData(e.target);
  const store = {}
  data.forEach((value, key) => store[key] = value);
  window.localStorage.setItem('invest_data', JSON.stringify(store));
}

function boostRegular(e) {
  e.preventDefault()

  const base = regularAmount.dataset.base

  if (e.target.dataset.plus) {
    const newValue = parseInt(e.target.dataset.plus) + parseInt(base)
    if (newValue != regularAmount.value) {
      regularBoosts.forEach(elem => {
        elem.classList.add('opacity-30')
      })
      e.target.classList.remove('opacity-30')
      regularAmount.value = newValue
    } else {
      regularAmount.value = base
      regularBoosts.forEach(elem => {
        elem.classList.remove('opacity-30')
      })
    }
  } else {
    if (e.target.value == '') return
    regularBoosts.forEach(elem => {
      elem.classList.remove('opacity-30')
    })
    regularAmount.value = e.target.value
  }
  refreshValues(e)
}

function formatMoney(amount) {
  const localeStr = amount.toLocaleString('en')

  return localeStr.match(/\.[0-9]{1}$/) ? localeStr + '0' : localeStr
}

function renderChart(data, adjustSlider = true) {
  const returns = data.returns.map(year => year.returns)
  const invested = data.invested
  const labels = data.returns.map(year => year.age)
  const ctx = chart ? chart.getContext('2d') : null
  const years = document.getElementById('fix-years')

  if (adjustSlider) {
    regularAmount.dataset.base = data.regular.amount
    regularAmount.value = data.regular.amount

    const min = Math.min(data.rate - 3, 5)
    const max = 15

    rateSlider.setAttribute('min', min)
    document.querySelector('[data-rate-min]').innerText = min
    rateSlider.setAttribute('max', max)
    document.querySelector('[data-rate-max]').innerText = max
    rateSlider.value = data.rate
  }

  ['blur', 'change'].forEach(ev => {
    document.getElementById('regular-amount-custom').addEventListener(ev, boostRegular)
  })

  regularBoosts.forEach(elem => {
    elem.addEventListener('click', boostRegular)
  })

  document.getElementById('explanation').classList.remove('hidden')
  document.querySelector('[data-returns]').innerText = formatMoney(data.total_returns)
  document.querySelector('[data-invested]').innerText = formatMoney(data.total_invested)
  document.querySelector('[data-duration]').innerText = returns.length
  document.querySelector('[data-rate]').innerText = data.rate
  document.querySelector('[data-regular]').innerText = formatMoney(data.regular.amount)
  document.querySelector('[data-regular-frequency]').innerText = data.regular.frequency.toLowerCase()
  document.querySelector('[data-initial]').innerText = formatMoney(data.initial)
  document.querySelector('[data-retirement-term]').innerText = data.returns.length
  document.querySelector('[data-salary]').innerText = formatMoney(data.annual_salary)
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
            borderColor: tailwindConfig.theme.colors.green[500],
            backgroundColor: 'rgba(0, 0, 0, 0)',
          },
          {
            label: 'Invested',
            data: invested,
            borderColor: tailwindConfig.theme.colors.blue[400],
            backgroundColor: 'rgba(0, 0, 0, 0)',
          }
        ]
      },
      options: {
        animation: {
          duration: adjustSlider ? 700 : 0
        },
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