/* --------------------------------------------------------------
   The QS Salary Index – Main Page Logic (No Charts)
   -------------------------------------------------------------- */
(() => {
  'use strict';

  // Cache DOM elements
  const searchInput = document.getElementById('search');
  const roleFilter = document.getElementById('roleFilter');
  const locationFilter = document.getElementById('locationFilter');
  const salaryRangeFilter = document.getElementById('salaryRange');
  const tableBody = document.getElementById('salaryTableBody');
  const noResults = document.getElementById('noResults');
  const loadingMsg = document.getElementById('loading');
  const resultsSection = document.getElementById('results');
  const entryCount = document.getElementById('entryCount');

  let allData = [];

  // === LOAD DATA ===
  async function loadData() {
    try {
      const res = await fetch('assets/data/salaries.json?t=' + Date.now());
      allData = await res.json();
      renderTable(allData);
      updateEntryCount(allData.length);
      loadingMsg.style.display = 'none';
      resultsSection.style.display = 'block';
    } catch (err) {
      console.error('Failed to load data:', err);
      loadingMsg.innerHTML = '<p style="color:#dc2626">Error loading data. Please try again later.</p>';
    }
  }

  // === RENDER TABLE ===
  function renderTable(data) {
    if (!data || data.length === 0) {
      tableBody.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    tableBody.innerHTML = data.map(entry => `
      <tr>
        <td data-label="Role">${escapeHtml(entry.title)}</td>
        <td data-label="Type">${escapeHtml(entry.qsType)}</td>
        <td data-label="Location">${escapeHtml(entry.city)}${entry.region ? `, ${escapeHtml(entry.region)}` : ''}</td>
        <td data-label="Salary" class="salary">${entry.salary}</td>
        <td data-label="Benefits">${formatBenefits(entry.benefits)}</td>
        <td data-label="Submitted">${formatDate(entry.submittedAt)}</td>
      </tr>
    `).join('');
  }

  // === FILTER & SEARCH ===
  function filterData() {
    const search = searchInput.value.trim().toLowerCase();
    const role = roleFilter.value;
    const location = locationFilter.value;
    const [min, max] = salaryRangeFilter.value.split('-').map(Number);

    const filtered = allData.filter(entry => {
      const matchesSearch = !search || 
        entry.title.toLowerCase().includes(search) ||
        entry.qsType.toLowerCase().includes(search) ||
        entry.city.toLowerCase().includes(search) ||
        entry.benefits.toLowerCase().includes(search);

      const matchesRole = !role || entry.qsType === role;
      const matchesLocation = !location || entry.city === location;

      const salaryMid = parseSalary(entry.salary);
      const matchesSalary = salaryMid >= min && salaryMid <= max;

      return matchesSearch && matchesRole && matchesLocation && matchesSalary;
    });

    renderTable(filtered);
    updateEntryCount(filtered.length);
  }

  // === HELPERS ===
  function parseSalary(range) {
    const nums = range.replace(/[^0-9-]/g, '').split('');
    const values = nums.filter(n => n).map(Number);
    return values.length === 2 ? (values[0] + values[1]) / 2 : values[0] || 0;
  }

  function formatBenefits(benefits) {
    if (!benefits) return '—';
    return escapeHtml(benefits.split(',').slice(0, 2).join(', ')) + (benefits.split(',').length > 2 ? '...' : '');
  }

  function formatDate(iso) {
    const date = new Date(iso);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateEntryCount(count) {
    if (entryCount) {
      entryCount.textContent = `Showing ${count} ${count === 1 ? 'entry' : 'entries'}`;
    }
  }

  // === EVENT LISTENERS ===
  document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Debounced search
    let searchTimeout;
    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterData, 300);
    });

    roleFilter?.addEventListener('change', filterData);
    locationFilter?.addEventListener('change', filterData);
    salaryRangeFilter?.addEventListener('change', filterData);
  });

  // Expose for debugging
  window.QS_DEBUG = { allData, renderTable, filterData };
})();
