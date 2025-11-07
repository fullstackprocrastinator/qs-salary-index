document.addEventListener('DOMContentLoaded', () => {
  loadData();
  populateFilters();
  document.getElementById('btnSearch').onclick = filterResults;
  document.getElementById('btnClear').onclick = () => location.reload();
});

let allSalaries = [];

async function loadData() {
  try {
    const res = await fetch(CONFIG.DATA_URL + '?t=' + Date.now());
    allSalaries = await res.json();
    displayResults(allSalaries);
    updateCounts();
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
    document.getElementById('filterRegion').disabled = !(uk || usa);
    document.getElementById('filterCity').disabled = true;
    if (!uk && !usa) return;

    const regionSel = document.getElementById('filterRegion');
    regionSel.innerHTML = '<option value="">All</option>';
    const list = uk ? CONFIG.UK_COUNTIES : CONFIG.USA_STATES;
    list.forEach(r => {
      const opt = new Option(r, r);
      regionSel.appendChild(opt);
    });
    regionSel.onchange = () => document.getElementById('filterCity').disabled = false;
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
      <p><strong>Location:</strong> ${s.city ? s.city + ', ' : ''}${s.region || ''}</p>
      <p><strong>Salary:</strong> £${s.salary}</p>
      <p><strong>Time in Role:</strong> ${s.timeInRole} years</p>
      <p><strong>Education:</strong> ${s.education}</p>
      ${s.sector ? `<p><strong>Sector:</strong> ${s.sector}</p>` : ''}
      ${s.certification ? `<p><strong>Cert:</strong> ${s.certification}</p>` : ''}
    </div>
  `).join('');
  container.innerHTML = html;
}

function updateCounts() {
  document.querySelectorAll('.admin-link').forEach(link => {
    link.textContent = `Admin (${allSalaries.length} live)`;
  });
}
