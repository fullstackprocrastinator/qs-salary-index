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

/* --------------------------------------------------------------
   FORM SUBMIT – SEND TO FORMSPREE + ATTACH pending.json
   -------------------------------------------------------------- */
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

  // Load existing pending + add new entry
  const pending = await fetchPending();
  pending.push(data);
  const jsonStr = JSON.stringify(pending, null, 2);

  /* ---- SEND VIA FORMSPREE (email + attached JSON) ---- */
  if (CONFIG.FORMSPREE_ENDPOINT && !CONFIG.FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    try {
      const resp = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: `New QS Salary – ${data.title} in ${data.city}`,
          message: `A new salary entry has been submitted.\n\nAttached: pending.json`,
          'pending.json': jsonStr
        })
      });

      if (!resp.ok) throw new Error('Formspree error');
      showSuccess();
    } catch (err) {
      console.error(err);
      showError('Submission failed. Please try again.');
    }
  } else {
    showError('Formspree not configured. Contact the admin.');
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

/* ---- UI FEEDBACK ---- */
function showSuccess() {
  document.getElementById('submitMsg').innerHTML = `
    <div style="
      background: #ecfdf5;
      color: #065f46;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #a7f3d0;
      font-weight: 500;
      line-height: 1.5;
      margin-top: 1rem;
    ">
      <strong>Thank you! Your salary has been submitted.</strong><br>
      It will be reviewed and added to the live index within 24 hours.<br>
      <small>— The QS Collection</small>
    </div>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `
    <div style="
      background: #fef2f2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #fca5a5;
      font-weight: 500;
      margin-top: 1rem;
    ">
      <strong>Error:</strong> ${msg}<br>
      <small>Please try again or contact support.</small>
    </div>`;
}
