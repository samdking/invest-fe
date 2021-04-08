import Chart from 'chart.js';
import resolveConfig from 'tailwindcss/resolveConfig'

const tailwindConfig = resolveConfig()
const form = document.getElementById('invest-form')
const regularAmount = document.getElementById('regular-amount')
const regularAmountCustom = document.getElementById('regular-amount-custom')
const rateSlider = document.getElementById('rate')
const regularBoosts = document.querySelectorAll('[data-plus]')
const chart = document.getElementById('myChart')
const inflation = document.getElementById('inflation')
const spinner = document.getElementById('spinner')
const tweakForm = document.getElementById('tweak-form')

const store = window.localStorage.getItem('invest_data')
const data = store ? JSON.parse(store) : null

if (data) {
  const formData = new FormData()
  Object.entries(data).forEach(field => {
    const [key, value] = field
    formData.set(key, value)
    if (form) {
      let input = form.querySelector(`[name='${key}']`)
      if (input.type == 'checkbox') {
        input.checked = value == '1'
      } else if (input.type == 'select') {
        input.selected = value
      } else if (input.type != 'hidden') {
        input.value = value
      }
    }
  })

  if (chart) {
    populateChartWithData(formData).then(data => {
      regularAmount.dataset.base = data.regular.amount
      regularAmount.value = data.regular.amount

      inflation.value = data.inflation

      if (data.inflation > 0) {
        inflation.checked = true
      }

      const min = Math.min(data.rate - 3, 5)
      const max = 15

      rateSlider.setAttribute('min', min)
      document.querySelector('[data-rate-min]').innerText = min
      rateSlider.setAttribute('max', max)
      document.querySelector('[data-rate-max]').innerText = max
      rateSlider.value = data.rate
    })
  }
}

if (form) form.addEventListener('submit', processForm)
if (rateSlider) rateSlider.addEventListener('change', refreshValues)
if (inflation) inflation.addEventListener('change', refreshValues)

if (regularAmountCustom) {
  regularAmountCustom.addEventListener('change', specifyRegular)
  regularAmountCustom.addEventListener('blur', specifyRegular)
}

regularBoosts.forEach(elem => {
  elem.addEventListener('click', boostRegular)
})

function populateChartWithData(data) {
  const host = window.location.hostname == 'localhost' ? 'http://localhost:4567' : "https://retirable.herokuapp.com"

  return fetch(`${host}/invest`, {
    method: 'POST',
    body: data,
  })
    .then(response => response.json())
    .then(data => renderChart(data.investment))
    .then(data => {
      spinner.classList.add('hidden')
      tweakForm.classList.remove('hidden')
      return data
    })
}

function refreshValues(e) {
  const formData = new FormData(e.target.form)

  Object.entries(data).forEach((arr) => {
    const [key, value] = arr
    if (!formData.has(key)) formData.set(key, value)
  })

  populateChartWithData(formData)
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

  refreshValues(e)
}

function specifyRegular(e) {
  e.preventDefault()

  if (e.target.value == '') return

  regularBoosts.forEach(elem => {
    elem.classList.remove('opacity-30')
  })

  regularAmount.value = e.target.value

  refreshValues(e)
}

function formatMoney(amount) {
  const localeStr = amount.toLocaleString('en')

  return localeStr.match(/\.[0-9]{1}$/) ? localeStr + '0' : localeStr
}

function renderChart(data, adjustSlider = true) {
  const returns = data.returns.map(year => year.returns)
  const retirementAge = [...data.returns].reverse()[0].age
  const invested = data.invested
  const labels = data.returns.map(year => year.age)
  const ctx = chart ? chart.getContext('2d') : null
  const years = document.getElementById('fix-years')

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
  document.querySelector('[data-adjusted-salary]').innerText = formatMoney(data.adjusted_annual_salary)
  document.querySelector('[data-inflation]').innerText = data.inflation
  document.querySelector('[data-retirement-age]').innerText = retirementAge
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

    return data
  }
}