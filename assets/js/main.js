/* --------------------------------------------------------------
   The QS Salary Index – Main Page Logic (Fixed Filters)
   -------------------------------------------------------------- */
(() => {
  'use strict';

  // Cache DOM elements
  const searchInput = document.getElementById('searchTitle');
  const roleFilter = document.getElementById('roleFilter');
  const locationFilter = document.getElementById('locationFilter');
  const salaryRangeFilter = document.getElementById('salaryRangeFilter');
  const tableBody = document.getElementById('salaryTableBody');
  const noResults = document.getElementById('noResults');
  const loadingMsg = document.getElementById('loadingMsg');
  const entryCount = document.getElementById('entryCount');

  let allData = [];

  // === LOAD DATA ===
  async function loadData() {
    try {
      loadingMsg.style.display = 'block';
      const res = await fetch('assets/data/salaries.json?t=' + Date.now());
      allData = await res.json();
      populateFilters();
      renderTable(allData);
      updateEntryCount(allData.length);
      loadingMsg.style.display = 'none';
    } catch (err) {
      console.error('Failed to load data:', err);
      loadingMsg.innerHTML = '<p style="color:#dc2626">Error loading data. Please refresh.</p>';
    }
  }

  // === POPULATE FILTERS ===
  function populateFilters() {
    // Roles (qsType)
    const roles = [...new Set(allData.map(s => s.qsType).filter(Boolean))].sort();
    roleFilter.innerHTML = '<option value="">All QS Types</option>';
    roles.forEach(role => roleFilter.appendChild(new Option(role, role)));

    // Locations (city)
    const locations = [...new Set(allData.map(s => s.city).filter(Boolean))].sort();
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(loc => locationFilter.appendChild(new Option(loc, loc)));

    // Salary ranges (pre-defined)
    salaryRangeFilter.innerHTML = '<option value="0-200000">All Salaries</option>';
    const ranges = [
      { value: '0-40000', label: 'Under £40k' },
      { value: '40000-60000', label: '£40k - £60k' },
      { value: '60000-80000', label: '£60k - £80k' },
      { value: '80000-100000', label: '£80k - £100k' },
      { value: '100000+', label: 'Over £100k' }
    ];
    ranges.forEach(r => salaryRangeFilter.appendChild(new Option(r.label, r.value)));
  }

  // === RENDER TABLE ===
  function renderTable(data) {
    if (!data || data.length === 0) {
      tableBody.innerHTML = '';
      noResults.style.display = 'block';
      entryCount.textContent = '0 entries';
      return;
    }

    noResults.style.display = 'none';
    tableBody.innerHTML = data.map(s => {
      const location = [s.city, s.region].filter(Boolean).join(', ') || '—';
      const benefits = s.benefits ? s.benefits : '—';
      const submitted = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : '—';

      return `
        <tr>
          <td>${s.title}</td>
          <td>${s.qsType || '—'}</td>
          <td>${location}</td>
          <td class="salary">${s.salary}</td>
          <td>${benefits}</td>
          <td class="submitted">${submitted}</td>
        </tr>
      `;
    }).join('');

    updateEntryCount(data.length);
  }

  // === FILTER & SEARCH ===
  function filterData() {
    const search = searchInput.value.toLowerCase();
    const role = roleFilter.value;
    const location = locationFilter.value;
    const salaryRange = salaryRangeFilter.value;

    let filtered = allData.filter(s => {
      // Search (title, qsType, city, benefits)
      const matchesSearch = !search || 
        s.title.toLowerCase().includes(search) ||
        (s.qsType && s.qsType.toLowerCase().includes(search)) ||
        s.city.toLowerCase().includes(search) ||
        (s.benefits && s.benefits.toLowerCase().includes(search));

      // Role filter
      const matchesRole = !role || s.qsType === role;

      // Location filter
      const matchesLocation = !location || s.city === location;

      // Salary filter
      let matchesSalary = true;
      if (salaryRange !== '0-200000') {
        const sal = parseSalary(s.salary);
        if (salaryRange === '100000+') {
          matchesSalary = sal >= 100000;
        } else {
          const [min, max] = salaryRange.split('-').map(Number);
          matchesSalary = sal >= min && sal <= max;
        }
      }

      return matchesSearch && matchesRole && matchesLocation && matchesSalary;
    });

    renderTable(filtered);
  }

  // === HELPERS ===
  function parseSalary(str) {
    if (!str) return 0;
    const nums = str.match(/\d+/g);
    if (!nums) return 0;
    if (nums.length === 1) return parseInt(nums[0]);
    return (parseInt(nums[0]) + parseInt(nums[1])) / 2;
  }

  function updateEntryCount(count) {
    entryCount.textContent = `${count} entries`;
  }

  // === EVENT LISTENERS ===
  document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Debounced search
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(filterData, 300);
    });

    [roleFilter, locationFilter, salaryRangeFilter].forEach(filter => {
      filter.addEventListener('change', filterData);
    });
  });
})();
