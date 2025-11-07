document.addEventListener('DOMContentLoaded', () => {
  // --- Populate Country Dropdown ---
  const countrySel = document.getElementById('country');
  CONFIG.COUNTRIES.forEach(c => {
    const opt = new Option(c, c);
    countrySel.appendChild(opt);
  });

  // --- Show UK / USA fields on country change ---
  countrySel.onchange = () => {
    const uk = countrySel.value === 'United Kingdom';
    const usa = countrySel.value === 'United States';

    document.getElementById('ukFields').style.display = uk ? 'block' : 'none';
    document.getElementById('usaFields').style.display = usa ? 'block' : 'none';

    if (uk) populateSelect('county', CONFIG.UK_COUNTIES);
    if (usa) populateSelect('state', CONFIG.USA_STATES);
  };
});

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Select...</option>';
  items.forEach(item => sel.appendChild(new Option(item, item)));
}

// --- FORM SUBMIT ---
document.getElementById('salaryForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;

  // --- Validate required fields ---
  const country = form.country.value;
  let region = '';
  const city = form.city.value.trim();

  if (country === 'United Kingdom') {
    region = form.county.value;
    if (!region || !city) return showError('Select county and enter city.');
  } else if (country === 'United States') {
    region = form.state.value;
    if (!region || !city) return showError('Select state and enter city.');
  } else if (!city && (country !== 'Other')) {
    return showError('City is required.');
  }

  // --- Build submission object ---
  const data = {
    id: Date.now().toString(),
    title: form.title.value,
    country: country,
    region: region,
    city: city,
    salary: form.salary.value,
    timeInRole: form.timeInRole.value,
    education: form.education.value,
    sector: form.sector.value || '',
    companySize: form.companySize.value || '',
    workArrangement: form.workArrangement.value || '',
    certification: form.certification.value.trim(),
    benefits: form.benefits.value.trim(),
    submittedAt: new Date().toISOString()
  };

  // --- 1. Try Formspree (optional) ---
  if (CONFIG.FORMSPREE_ENDPOINT && !CONFIG.FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    try {
      const resp = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          ...data,
          _subject: `New QS Salary: ${data.title} – ${data.city}, ${data.country}`
        }).toString()
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      console.log('Formspree: Email sent');
    } catch (err) {
      console.warn('Formspree failed (continuing anyway):', err);
    }
  }

  // --- 2. ALWAYS DOWNLOAD pending.json ---
  try {
    const pending = await fetchPending();
    pending.push(data);
    forceDownload(JSON.stringify(pending, null, 2), 'pending.json', 'application/json');
    showSuccess();
  } catch (err) {
    console.error('Download failed:', err);
    showError('Could not save data. Check browser console.');
  }

  // --- Reset form ---
  form.reset();
  document.getElementById('ukFields').style.display = 'none';
  document.getElementById('usaFields').style.display = 'none';
};

// --- Helper: Force file download (works in all browsers) ---
function forceDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// --- Fetch existing pending.json ---
async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// --- UI Feedback ---
function showSuccess() {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green; font-weight:bold;">
      Submitted! "pending.json" has been downloaded.<br>
      <small>Upload it to GitHub → <code>assets/data/pending.json</code></small>
    </p>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:red; font-weight:bold;">Error: ${msg}</p>`;
}
