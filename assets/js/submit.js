document.addEventListener('DOMContentLoaded', () => {
  const countrySel = document.getElementById('country');
  const countySel = document.getElementById('county');
  const stateSel = document.getElementById('state');
  const cityInputs = document.querySelectorAll('input[name="city"]');

  // Populate countries
  CONFIG.COUNTRIES.forEach(c => countrySel.appendChild(new Option(c, c)));

  // On country change
  countrySel.onchange = () => {
    const uk = countrySel.value === 'United Kingdom';
    const usa = countrySel.value === 'United States';

    document.getElementById('ukFields').style.display = uk ? 'block' : 'none';
    document.getElementById('usaFields').style.display = usa ? 'block' : 'none';

    // Reset required
    countySel.required = false;
    stateSel.required = false;
    cityInputs.forEach(inp => inp.required = false);

    if (uk) {
      populateSelect('county', CONFIG.UK_COUNTIES);
      countySel.required = true;
      cityInputs[0].required = true;
    }
    if (usa) {
      populateSelect('state', CONFIG.USA_STATES);
      stateSel.required = true;
      cityInputs[1].required = true;
    }
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

  const country = form.country.value;
  let region = '';
  const city = form.city.value.trim();

  // Validate location
  if (country === 'United Kingdom') {
    region = form.county.value;
    if (!region || !city) return showError('Please select county and enter city.');
  } else if (country === 'United States') {
    region = form.state.value;
    if (!region || !city) return showError('Please select state and enter city.');
  }

  const data = {
    id: Date.now().toString(),
    title: form.title.value,
    qsType: form.qsType.value,  // ← NEW FIELD
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

  // Try Formspree
  if (CONFIG.FORMSPREE_ENDPOINT && !CONFIG.FORMSPREE_ENDPOINT.includes('xnnlaqka')) {
    try {
      await fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          ...data,
          _subject: `New QS Salary: ${data.title} (${data.qsType}) – ${data.city}, ${data.country}`
        }).toString()
      });
    } catch (err) {
      console.warn('Formspree failed:', err);
    }
  }

  // Always download
  const pending = await fetchPending();
  pending.push(data);
  forceDownload(JSON.stringify(pending, null, 2), 'pending.json', 'application/json');
  showSuccess();

  form.reset();
  document.getElementById('ukFields').style.display = 'none';
  document.getElementById('usaFields').style.display = 'none';
};

async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

function forceDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function showSuccess() {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green; font-weight:bold;">
      Submitted! "pending.json" downloaded.<br>
      <small>Upload to GitHub → assets/data/pending.json</small>
    </p>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `<p style="color:red; font-weight:bold;">${msg}</p>`;
}
