let lastPendingData = null;

document.addEventListener('DOMContentLoaded', () => {
  const countrySel = document.getElementById('country');
  const ukSubSel = document.getElementById('ukSub');
  const countySel = document.getElementById('county');
  const scotlandRegionSel = document.getElementById('scotlandRegion');
  const walesRegionSel = document.getElementById('walesRegion');
  const stateSel = document.getElementById('state');

  // Hide all location fields
  ['ukSubFields', 'englandFields', 'scotlandFields', 'walesFields', 'usaFields', 'otherFields'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Populate countries
  CONFIG.COUNTRIES.forEach(c => countrySel.appendChild(new Option(c, c)));

  // === COUNTRY CHANGE ===
  countrySel.onchange = () => {
    const selected = countrySel.value;

    // Hide all
    ['ukSubFields', 'englandFields', 'scotlandFields', 'walesFields', 'usaFields', 'otherFields'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Reset required
    document.querySelectorAll('input[name="city"], select[name="region"]').forEach(inp => inp.required = false);
    [countySel, scotlandRegionSel, walesRegionSel, stateSel].forEach(sel => sel.required = false);

    if (!selected) return;

    if (selected === 'United Kingdom') {
      document.getElementById('ukSubFields').style.display = 'block';
      ukSubSel.value = '';
    } else if (selected === 'United States') {
      document.getElementById('usaFields').style.display = 'block';
      populateSelect('state', CONFIG.USA_STATES);
      stateSel.required = true;
      document.getElementById('usaCity').required = true;
    } else {
      document.getElementById('otherFields').style.display = 'block';
      document.getElementById('otherCity').required = true;
    }
  };

  // === UK SUB-REGION CHANGE ===
  ukSubSel.onchange = () => {
    const sub = ukSubSel.value;

    // Hide UK-specific fields
    ['englandFields', 'scotlandFields', 'walesFields'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    if (sub === 'england') {
      document.getElementById('englandFields').style.display = 'block';
      populateSelect('county', CONFIG.UK_COUNTIES);
      document.getElementById('englandCity').required = true;
    } else if (sub === 'scotland') {
      document.getElementById('scotlandFields').style.display = 'block';
      populateSelect('scotlandRegion', CONFIG.SCOTLAND_COUNCIL_AREAS);
      document.getElementById('scotlandCity').required = true;
    } else if (sub === 'wales') {
      document.getElementById('walesFields').style.display = 'block';
      populateSelect('walesRegion', CONFIG.WALES_PRINCIPAL_AREAS);
      document.getElementById('walesCity').required = true;
    }
  };
});

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Select (optional)...</option>';
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

  // === VALIDATE & COLLECT LOCATION ===
  if (country === 'United Kingdom') {
    const ukSub = form.ukSub.value;
    if (!ukSub) return showError('Please select England, Scotland, or Wales.');

    if (ukSub === 'england') {
      region = form.county.value || '';
      city = document.getElementById('englandCity').value.trim();
    } else if (ukSub === 'scotland') {
      region = form.scotlandRegion.value || '';
      city = document.getElementById('scotlandCity').value.trim();
    } else if (ukSub === 'wales') {
      region = form.walesRegion.value || '';
      city = document.getElementById('walesCity').value.trim();
    }

    if (!city) return showError('Please enter city.');

  } else if (country === 'United States') {
    region = form.state.value;
    city = document.getElementById('usaCity').value.trim();
    if (!region || !city) return showError('Please select state and enter city.');
  } else {
    city = document.getElementById('otherCity').value.trim();
    if (!city) return showError('Please enter city.');
  }

  // === BUILD DATA OBJECT ===
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

  // === LOAD PENDING + APPEND NEW ===
  const pending = await fetchPending();
  pending.push(data);
  const jsonStr = JSON.stringify(pending, null, 2);

  /* ---- SEND VIA FORMSPREE ---- */
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

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      showSuccess();
    } catch (err) {
      console.error('Submission failed:', err);
      showError('Submission failed. Please try again later.');
    }
  } else {
    showError('Formspree not configured. Contact admin.');
  }

  // Reset form
  form.reset();
  ['ukSubFields', 'englandFields', 'scotlandFields', 'walesFields', 'usaFields', 'otherFields'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
};

async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    return res.ok ? await res.json() : [];
  } catch (err) {
    console.warn('Could not load pending.json:', err);
    return [];
  }
}

function setCityRequired(id) {
  // Remove required from all city fields
  ['englandCity', 'scotlandCity', 'walesCity', 'usaCity', 'otherCity'].forEach(cid => {
    const el = document.getElementById(cid);
    if (el) el.required = false;
  });
  // Set required on the active one
  const active = document.getElementById(id);
  if (active) active.required = true;
}

/* ---- UI FEEDBACK ---- */
function showSuccess() {
  document.getElementById('submitMsg').innerHTML = `
    <div style="
      background: #ecfdf5; color: #065f46; padding: 1rem; border-radius: 8px;
      border: 1px solid #a7f3d0; font-weight: 500; line-height: 1.5; margin-top: 1rem;
    ">
      <strong>Thank you! Your salary has been submitted.</strong><br>
      It will be reviewed and added to the live index within 24 hours.<br>
      <em>You’ll receive a confirmation email shortly.</em><br>
      <small>— The QS Collection</small>
    </div>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `
    <div style="
      background: #fef2f2; color: #991b1b; padding: 1rem; border-radius: 8px;
      border: 1px solid #fca5a5; font-weight: 500; margin-top: 1rem;
    ">
      <strong>Error:</strong> ${msg}<br>
      <small>Please try again or contact support.</small>
    </div>`;
}
