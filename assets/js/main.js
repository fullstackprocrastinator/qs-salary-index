// === CONFIG & GLOBAL STATE ===
let currentData = [];
let sortDirection = {};
let charts = {};

// === DATA LOADING ===
async function loadData() {
  try {
    const res = await fetch(CONFIG.DATA_URL + '?t=' + Date.now());
    const data = res.ok ? await res.json() : [];
    currentData = data;
    populateFilters(data);
    displayResults(data);
  } catch (err) {
    console.error('Failed to load data:', err);
    document.querySelector('#salariesTable tbody').innerHTML =
      '<tr><td colspan="10" style="text-align:center; color:#94a3b8;">Error loading data.</td></tr>';
  }
}

// === FILTERS ===
function populateFilters(data) {
  const countries = [...new Set(data.map(s => s.country).filter(Boolean))].sort();
  const countrySel = document.getElementById('filterCountry');
  countrySel.innerHTML = '<option value="">All Countries</option>';
  countries.forEach(c => countrySel.appendChild(new Option(c, c)));

  // Region & City cascade
  countrySel.onchange = () => {
    const selected = countrySel.value;
    const regions = selected
      ? [...new Set(data.filter(s => s.country === selected).map(s => s.region).filter(Boolean))].sort()
      : [];
    const regionSel = document.getElementById('filterRegion');
    regionSel.innerHTML = '<option value="">All Regions</option>';
    regions.forEach(r => regionSel.appendChild(new Option(r, r)));
    regionSel.disabled = !selected;

    const cities = selected
      ? [...new Set(data.filter(s => s.country === selected).map(s => s.city).filter(Boolean))].sort()
      : [];
    const citySel = document.getElementById('filterCity');
    citySel.innerHTML = '<option value="">All Cities</option>';
    cities.forEach(c => citySel.appendChild(new Option(c, c)));
    citySel.disabled = !selected;
  };
}

// === SEARCH & FILTER ===
document.getElementById('btnSearch').onclick = () => {
  const title = document.getElementById('searchTitle').value.toLowerCase();
  const country = document.getElementById('filterCountry').value;
  const region = document.getElementById('filterRegion').value;
  const city = document.getElementById('filterCity').value;
  const level = document.getElementById('filterLevel').value;

  let filtered = currentData;

  if (title) filtered = filtered.filter(s => s.title?.toLowerCase().includes(title));
  if (country) filtered = filtered.filter(s => s.country === country);
  if (region) filtered = filtered.filter(s => s.region === region);
  if (city) filtered = filtered.filter(s => s.city === city);
  if (level) filtered = filtered.filter(s => s.title === level);

  displayResults(filtered);
};

document.getElementById('btnClear').onclick = () => {
  document.getElementById('searchTitle').value = '';
  document.getElementById('filterCountry').value = '';
  document.getElementById('filterRegion').value = '';
  document.getElementById('filterRegion').disabled = true;
  document.getElementById('filterCity').value = '';
  document.getElementById('filterCity').disabled = true;
  document.getElementById('filterLevel').value = '';
  displayResults(currentData);
};

// === DISPLAY RESULTS (TABLE) ===
function displayResults(data) {
  const tbody = document.querySelector('#salariesTable tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#94a3b8;">No results found.</td></tr>';
    return;
  }

  const rows = data.map(s => {
    const location = [s.city, s.region].filter(Boolean).join(', ') || '—';
    const benefits = s.benefits ? s.benefits.trim() : '—';
    const cert = s.certification ? s.certification.trim() : '—';

    // Format submittedAt: "Nov 2025"
    let submitted = '—';
    if (s.submittedAt) {
      try {
        const date = new Date(s.submittedAt);
        if (!isNaN(date)) {
          submitted = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        }
      } catch (e) {
        console.warn('Invalid submittedAt:', s.submittedAt);
      }
    }

    return `
      <tr>
        <td><strong>${s.title || '—'}</strong></td>
        <td>${s.qsType || '—'}</td>
        <td>${location}</td>
        <td><strong>${s.salary || '—'}</strong></td>
        <td>${s.timeInRole || '—'}</td>
        <td>${s.education || '—'}</td>
        <td>${s.sector || '—'}</td>
        <td>${cert}</td>
        <td class="benefits-cell">${benefits}</td>
        <td class="submitted-cell">${submitted}</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;

  // Re-init charts
  destroyCharts();
  setTimeout(() => initCharts(data), 100);

  // Enable sorting
  initSorting(data);
}

// === SORTABLE TABLE ===
function sortTable(column) {
  const direction = sortDirection[column] === 'asc' ? 'desc' : 'asc';
  sortDirection = { [column]: direction };

  currentData.sort((a, b) => {
    let aVal = a[column] || '';
    let bVal = b[column] || '';

    if (column === 'location') {
      aVal = [a.city, a.region].filter(Boolean).join(', ');
      bVal = [b.city, b.region].filter(Boolean).join(', ');
    } else if (column === 'salary') {
      aVal = parseSalary(a.salary);
      bVal = parseSalary(b.salary);
    } else if (column === 'submittedAt') {
      aVal = new Date(a.submittedAt || 0);
      bVal = new Date(b.submittedAt || 0);
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  displayResults(currentData);

  // Update arrow
  document.querySelectorAll('#salariesTable th').forEach(th => {
    th.innerHTML = th.innerHTML.replace(/ [↑↓]$/, '');
  });
  const header = document.querySelector(`th[data-sort="${column}"]`);
  header.innerHTML += direction === 'asc' ? ' ↑' : ' ↓';
}

function parseSalary(salaryStr) {
  if (!salaryStr) return 0;
  return parseFloat(salaryStr.replace(/[^0-9.-]/g, '')) || 0;
}

function initSorting(data) {
  currentData = [...data];
  document.querySelectorAll('#salariesTable th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.onclick = () => sortTable(th.dataset.sort);
  });
}

// === CHARTS ===
function initCharts(data) {
  // Chart 1: By Country
  const byCountry = data.reduce((acc, s) => {
    const country = s.country || 'Unknown';
    acc[country] = (acc[country] || 0) + parseSalary(s.salary);
    acc[`${country}_count`] = (acc[`${country}_count`] || 0) + 1;
    return acc;
  }, {});

  const countryLabels = Object.keys(byCountry).filter(k => !k.endsWith('_count'));
  const countryData = countryLabels.map(c => byCountry[c] / byCountry[`${c}_count`]);

  charts.country = new Chart(document.getElementById('chartByCountry'), {
    type: 'bar',
    data: {
      labels: countryLabels,
      datasets: [{
        label: 'Avg Salary',
        data: countryData,
        backgroundColor: '#1e40af'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // Chart 2: By Level
  const levels = ['Trainee QS', 'Assistant QS', 'QS', 'Senior QS', 'Cost Manager', 'Commercial Manager'];
  const levelData = levels.map(l => {
    const matches = data.filter(s => s.title === l);
    return matches.length ? matches.reduce((sum, s) => sum + parseSalary(s.salary), 0) / matches.length : 0;
  });

  charts.level = new Chart(document.getElementById('chartByLevel'), {
    type: 'doughnut',
    data: {
      labels: levels,
      datasets: [{
        data: levelData,
        backgroundColor: CONFIG.CHART_COLORS.light
      }]
    },
    options: { responsive: true }
  });

  // Chart 3: Salary Distribution
  const salaryRanges = ['<£40k', '£40k-£60k', '£60k-£80k', '£80k-£100k', '>£100k'];
  const dist = salaryRanges.map(range => {
    const [min, max] = range.includes('<') ? [0, 40000] :
                      range.includes('>') ? [100000, Infinity] :
                      range.split('-').map(s => parseInt(s.replace(/[^0-9]/g, '')) * 1000);
    return data.filter(s => {
      const sal = parseSalary(s.salary);
      return sal >= min && sal < max;
    }).length;
  });

  charts.dist = new Chart(document.getElementById('chartSalaryDist'), {
    type: 'bar',
    data: {
      labels: salaryRanges,
      datasets: [{
        label: 'Entries',
        data: dist,
        backgroundColor: '#16a34a'
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

function destroyCharts() {
  Object.values(charts).forEach(chart => chart?.destroy());
  charts = {};
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  loadData();
});
