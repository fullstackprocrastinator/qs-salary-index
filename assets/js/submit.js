let lastPendingData = null;

document.addEventListener('DOMContentLoaded', () => {
  const countrySel = document.getElementById('country');
  const countySel = document.getElementById('county');
  const stateSel = document.getElementById('state');

  // Hide all location fields
  ['ukFields', 'usaFields', 'otherCity'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  // Populate countries
  CONFIG.COUNTRIES.forEach(c => countrySel.appendChild(new Option(c, c)));

  // Country change
  countrySel.onchange = () => {
    const uk = countrySel.value === 'United Kingdom';
    const usa = countrySel.value === 'United States';
    const other = !uk && !usa && countrySel.value;

    document.getElementById('ukFields').style.display = 'none';
    document.getElementById('usaFields').style.display = 'none';
    document.getElementById('otherCity').style.display = 'none';

    document.querySelectorAll('input[name="city"]').forEach(inp => inp.required = false);
    countySel.required = false;
    stateSel.required = false;

    if (uk) {
      document.getElementById('ukFields').style.display = 'block';
      populateSelect('county', CONFIG.UK_COUNTIES);
      countySel.required = true;
      document.getElementById('ukCity').required = true;
    } else if (usa) {
      document.getElementById('usaFields').style.display = 'block';
      populateSelect('state', CONFIG.USA_STATES);
      stateSel.required = true;
      document.getElementById('usaCity').required = true;
    } else if (other) {
      document.getElementById('otherCity').style.display = 'block';
      document.getElementById('otherCityInput').required = true;
    }
  };
});

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Select...</option>';
  items.forEach(item => sel.appendChild(new Option(item, item)));
}

// --- SUBMIT: Auto-Send via Formspree ---
document.getElementById('salaryForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;

  const country = form.country.value;
  let region = '';
  let city = '';

  if (country === 'United Kingdom') {
    region = form.county.value;
    city = document.getElementById('ukCity').value.trim();
    if (!region || !city) return showError('Please select county and enter city.');
  } else if (country === 'United States') {
    region = form.state.value;
    city = document.getElementById('usaCity').value.trim();
    if (!region || !city) return showError('Please select state and enter city.');
  } else {
    city = document.getElementById('otherCityInput').value.trim();
    if (!city) return showError('Please enter city.');
  }

  const data = {
    id: Date.now().toString(),
    title: form.title.value,
    qsType: form.qsType.value,
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

  // Load existing + append
  const pending = await fetchPending();
  pending.push(data);
  const jsonStr = JSON.stringify(pending, null, 2);

  // AUTO-SEND TO FORMSPREE (email + attachment)
  if (CONFIG.FORMSPREE_ENDPOINT && !CONFIG.FORMSPREE_ENDPOINT.includes('xnnlaqka')) {
    try {
      const response = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: `New QS Salary Submission – ${data.title} in ${data.city}`,
          message: `A new salary has been submitted.\n\nAttached: pending.json`,
          'pending.json': jsonStr  // Formspree auto-attaches this
        })
      });

      if (!response.ok) throw new Error('Formspree failed');
      showSuccess('Submitted! You’ll receive an email with the data.');
    } catch (err) {
      console.error(err);
      showError('Submission failed. Try again.');
    }
  } else {
    showError('Formspree not configured. Contact admin.');
  }

  // Reset form
  form.reset();
  ['ukFields', 'usaFields', 'otherCity'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
};

async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

function showSuccess(msg) {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green; font-weight:bold;">${msg}</p>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:red; font-weight:bold;">${msg}</p>`;
}
