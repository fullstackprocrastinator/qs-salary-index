document.addEventListener('DOMContentLoaded', () => {
  loadData();
  populateFilters();
  document.getElementById('btnSearch').onclick = filterResults;
  document.getElementById('btnClear').onclick = () => location.reload();
});

let allSalaries = [];
let charts = {};

async function loadData() {
  try {
    const res = await fetch(CONFIG.DATA_URL + '?t=' + Date.now());
    allSalaries = await res.json();
    displayResults(allSalaries);
    updateCounts();
    initCharts();
  } catch (e) {
    document.getElementById('results').innerHTML = '<p>Error loading data.</p>';
  }
}

function populateFilters() {
  const countrySel = document.getElementById('filterCountry');
  CONFIG.COUNTRIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countrySel.appendChild(opt);
  });

  countrySel.onchange = () => {
    const uk = countrySel.value === 'United Kingdom';
    const usa = countrySel.value === 'United States';
    const regionSel = document.getElementById('filterRegion');
    const citySel = document.getElementById('filterCity');

    regionSel.disabled = !(uk || usa);
    citySel.disabled = true;
    regionSel.innerHTML = '<option value="">All</option>';

    if (!uk && !usa) return;

    const list = uk ? CONFIG.UK_COUNTIES : CONFIG.USA_STATES;
    list.forEach(r => {
      const opt = new Option(r, r);
      regionSel.appendChild(opt);
    });

    regionSel.onchange = () => citySel.disabled = false;
  };
}

function filterResults() {
  let filtered = allSalaries;

  const title = document.getElementById('searchTitle').value.trim().toLowerCase();
  if (title) filtered = filtered.filter(s => s.title.toLowerCase().includes(title));

  const country = document.getElementById('filterCountry').value;
  if (country) filtered = filtered.filter(s => s.country === country);

  const region = document.getElementById('filterRegion').value;
  if (region) filtered = filtered.filter(s => s.region === region);

  const city = document.getElementById('filterCity').value.trim();
  if (city) filtered = filtered.filter(s => s.city.toLowerCase().includes(city.toLowerCase()));

  const level = document.getElementById('filterLevel').value;
  if (level) filtered = filtered.filter(s => s.title.includes(level));

  displayResults(filtered);
}

function displayResults(data) {
  const container = document.getElementById('results');
  if (data.length === 0) {
    container.innerHTML = '<p>No results found.</p>';
    return;
  }

  const html = data.map(s => `
    <div class="result-card">
      <h3>${s.title} (${s.country})</h3>
      <p><strong>Type:</strong> ${s.qsType || '—'}</p>
      <p><strong>Location:</strong> ${s.city ? s.city + ', ' : ''}${s.region || ''}</p>
      <p><strong>Salary:</strong> ${s.salary}</p>
      <p><strong>Time in Role:</strong> ${s.timeInRole} years</p>
      <p><strong>Education:</strong> ${s.education}</p>
      ${s.sector ? `<p><strong>Sector:</strong> ${s.sector}</p>` : ''}
      ${s.certification ? `<p><strong>Cert:</strong> ${s.certification}</p>` : ''}
    </div>
  `).join('');
  container.innerHTML = html;

  // Re-init charts after filtering
  destroyCharts();
  setTimeout(initCharts, 100);
}

function updateCounts() {
  document.querySelectorAll('.admin-link').forEach(link => {
    link.textContent = `Admin (${allSalaries.length} live)`;
  });
}

// === CHARTS ===
function initCharts() {
  if (allSalaries.length === 0) return;

  const colors = CONFIG.CHART_COLORS.light;

  // Helper: parse salary midpoint
  const parseSalaryMid = (str) => {
    const nums = str.match(/\d+/g);
    if (!nums) return 0;
    if (nums.length === 1) return parseInt(nums[0]);
    return (parseInt(nums[0]) + parseInt(nums[1])) / 2;
  };

  // Chart 1: By Country
  const countryData = {};
  allSalaries.forEach(s => {
    const mid = parseSalaryMid(s.salary);
    if (!countryData[s.country]) countryData[s.country] = [];
    countryData[s.country].push(mid);
  });

  const avg = arr => arr.length ? Math.round(arr.reduce((a,b) => a + b, 0) / arr.length) : 0;

  charts.byCountry = new Chart(document.getElementById('chartByCountry'), {
    type: 'bar',
    data: {
      labels: Object.keys(countryData),
      datasets: [{
        label: 'Avg Salary (GBP)',
        data: Object.values(countryData).map(avg),
        backgroundColor: colors[0]
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Average Salary by Country' } }
    }
  });

  // Chart 2: By Role Level
  const levelData = {};
  allSalaries.forEach(s => {
    const level = s.title.split(' ')[0]; // e.g. "Senior" from "Senior QS"
    const mid = parseSalaryMid(s.salary);
    if (!levelData[level]) levelData[level] = [];
    levelData[level].push(mid);
  });

  charts.byLevel = new Chart(document.getElementById('chartByLevel'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(levelData),
      datasets: [{
        data: Object.values(levelData).map(avg),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Avg Salary by Role Level' } }
    }
  });

  // Chart 3: Salary Distribution
  const bins = { '<30k': 0, '30-50k': 0, '50-70k': 0, '70-90k': 0, '90k+': 0 };
  allSalaries.forEach(s => {
    const mid = parseSalaryMid(s.salary);
    if (mid < 30000) bins['<30k']++;
    else if (mid < 50000) bins['30-50k']++;
    else if (mid < 70000) bins['50-70k']++;
    else if (mid < 90000) bins['70-90k']++;
    else bins['90k+']++;
  });

  charts.salaryDist = new Chart(document.getElementById('chartSalaryDist'), {
    type: 'bar',
    data: {
      labels: Object.keys(bins),
      datasets: [{
        label: 'Number of QS',
        data: Object.values(bins),
        backgroundColor: colors[2]
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Salary Distribution' } }
    }
  });
}

function destroyCharts() {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
}
