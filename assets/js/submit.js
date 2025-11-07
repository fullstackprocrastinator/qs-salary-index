let lastPendingData = null;

document.addEventListener('DOMContentLoaded', () => {
  const countrySel = document.getElementById('country');
  const countySel = document.getElementById('county');
  const stateSel = document.getElementById('state');

  // Hide all city fields initially
  ['ukFields', 'usaFields', 'otherCity'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  // Populate countries
  CONFIG.COUNTRIES.forEach(c => countrySel.appendChild(new Option(c, c)));

  // On country change
  countrySel.onchange = () => {
    const uk = countrySel.value === 'United Kingdom';
    const usa = countrySel.value === 'United States';
    const other = !uk && !usa && countrySel.value;

    // Hide all
    document.getElementById('ukFields').style.display = 'none';
    document.getElementById('usaFields').style.display = 'none';
    document.getElementById('otherCity').style.display = 'none';

    // Reset required
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

  document.getElementById('emailPending').onclick = () => {
    if (!lastPendingData) {
      showEmailStatus('Submit first.', 'red');
      return;
    }
    emailPendingFile(lastPendingData);
  };
});

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Select...</option>';
  items.forEach(item => sel.appendChild(new Option(item, item)));
}

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

  const pending = await fetchPending();
  pending.push(data);
  const jsonStr = JSON.stringify(pending, null, 2);
  lastPendingData = jsonStr;

  forceDownload(jsonStr, 'pending.json', 'application/json');
  showSuccess();
  document.getElementById('emailPending').style.display = 'inline-block';

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

function forceDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function showSuccess() {
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green; font-weight:bold;">
      Submitted! "pending.json" downloaded.<br>
      <small>Click below to email it to admin.</small>
    </p>`;
}

function showError(msg) {
  document.getElementById('submitMsg').innerHTML = `<p style="color:red; font-weight:bold;">${msg}</p>`;
}

function emailPendingFile(jsonStr) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const mailto = `mailto:YOUR_EMAIL@example.com?subject=New%20QS%20Salary&body=${encodeURIComponent(
    'Attached: pending.json\nDownload: ' + url
  )}`;
  window.location.href = mailto;
  showEmailStatus('Email opened! Attach file manually.', 'green');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showEmailStatus(msg, color) {
  document.getElementById('emailStatus').innerHTML = `<p style="color:${color};">${msg}</p>`;
}
