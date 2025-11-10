/* --------------------------------------------------------------
   The QS Salary Index – Main Page Logic (Robust Loading)
   -------------------------------------------------------------- */
(() => {
  'use strict';

  // ---------- DOM CACHE ----------
  const searchInput       = document.getElementById('search');
  const roleFilter        = document.getElementById('roleFilter');
  const locationFilter    = document.getElementById('locationFilter');
  const salaryRangeFilter = document.getElementById('salaryRange');
  const tableBody         = document.getElementById('salaryTableBody');
  const noResults         = document.getElementById('noResults');
  const loadingMsg        = document.getElementById('loading');
  const resultsSection    = document.getElementById('results');
  const entryCount        = document.getElementById('entryCount');

  let allData = [];

  // ---------- FALLBACK DATA (shown if JSON fails) ----------
  const fallbackData = [
    {
      title: "Senior QS", qsType: "Main Contractor", city: "London", region: "Greater London",
      salary: "£70,000 - £80,000", benefits: "Car allowance, pension", submittedAt: "2025-11-01"
    },
    {
      title: "Assistant QS", qsType: "Consultant", city: "Chelmsford", region: "Essex",
      salary: "£40,000 - £50,000", benefits: "Pension", submittedAt: "2025-11-02"
    }
  ];

  // ---------- LOAD DATA ----------
  async function loadData() {
    try {
      console.log('Fetching salaries.json...');
      const res = await fetch('assets/data/salaries.json?t=' + Date.now());

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      allData = await res.json();
      console.log(`Loaded ${allData.length} entries`);
    } catch (err) {
      console.error('Failed to load salaries.json →', err);
      // ---- SHOW ERROR ----
      loadingMsg.innerHTML = `
        <p style="color:#dc2626">
          Could not load live data.<br>
          <small>Check that <code>assets/data/salaries.json</code> exists.</small>
        </p>`;
      // ---- FALLBACK ----
      allData = fallbackData;
    } finally {
      populateFilters();
      renderTable(allData);
      updateEntryCount(allData.length);
      loadingMsg.style.display = 'none';
      resultsSection.style.display = 'block';
    }
  }

  // ---------- POPULATE FILTER DROPDOWNS ----------
  function populateFilters() {
    const roles = [...new Set(allData.map(e => e.qsType).filter(Boolean))].sort();
    roleFilter.innerHTML = '<option value="">All Roles</option>' +
      roles.map(r => `<option value="${r}">${r}</option>`).join('');

    const cities = [...new Set(allData.map(e => e.city).filter(Boolean))].sort();
    locationFilter.innerHTML = '<option value="">All Locations</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // ---------- RENDER TABLE ----------
  function renderTable(data) {
    if (!data || data.length === 0) {
      tableBody.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }
    noResults.style.display = 'none';

    tableBody.innerHTML = data.map(entry => {
      const location = [entry.city, entry.region].filter(Boolean).join(', ') || '—';
      const benefits = entry.benefits ? entry.benefits.split(',').slice(0,2).join(', ') +
                       (entry.benefits.split(',').length > 2 ? '...' : '') : '—';
      const date = new Date(entry.submittedAt).toLocaleDateString('en-GB', {day:'numeric', month:'short'});

      return `
        <tr>
          <td data-label="Role">${escapeHtml(entry.title)}</td>
          <td data-label="Type">${escapeHtml(entry.qsType || '—')}</td>
          <td data-label="Location">${escapeHtml(location)}</td>
          <td data-label="Salary" class="salary">${escapeHtml(entry.salary)}</td>
          <td data-label="Benefits">${escapeHtml(benefits)}</td>
          <td data-label="Submitted">${date}</td>
        </tr>`;
    }).join('');
  }

  // ---------- FILTER LOGIC ----------
  function filterData() {
    const search = searchInput.value.trim().toLowerCase();
    const role   = roleFilter.value;
    const loc    = locationFilter.value;
    const [min, max] = salaryRangeFilter.value.split('-').map(Number);

    const filtered = allData.filter(entry => {
      const matchesSearch = !search ||
        entry.title.toLowerCase().includes(search) ||
        (entry.qsType && entry.qsType.toLowerCase().includes(search)) ||
        entry.city.toLowerCase().includes(search) ||
        (entry.benefits && entry.benefits.toLowerCase().includes(search));

      const matchesRole = !role || entry.qsType === role;
      const matchesLoc  = !loc  || entry.city === loc;

      const midSalary = parseSalary(entry.salary);
      const matchesSal = midSalary >= min && midSalary <= max;

      return matchesSearch && matchesRole && matchesLoc && matchesSal;
    });

    renderTable(filtered);
    updateEntryCount(filtered.length);
  }

  // ---------- HELPERS ----------
  function parseSalary(str) {
    const nums = (str || '').match(/\d+/g) || [];
    if (nums.length === 0) return 0;
    if (nums.length === 1) return parseInt(nums[0]);
    return (parseInt(nums[0]) + parseInt(nums[1])) / 2;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateEntryCount(cnt) {
    entryCount.textContent = `Showing ${cnt} ${cnt === 1 ? 'entry' : 'entries'}`;
  }

  // ---------- EVENT LISTENERS ----------
  document.addEventListener('DOMContentLoaded', () => {
    loadData();

    let searchTO;
    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTO);
      searchTO = setTimeout(filterData, 300);
    });

    roleFilter?.addEventListener('change', filterData);
    locationFilter?.addEventListener('change', filterData);
    salaryRangeFilter?.addEventListener('change', filterData);
  });

  // expose for debugging
  window.QS_DEBUG = { allData, renderTable, filterData };
})();
