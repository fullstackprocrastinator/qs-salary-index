document.addEventListener('DOMContentLoaded', () => {
  // Populate Country
  const countrySel = document.getElementById('country');
  CONFIG.COUNTRIES.forEach(c => {
    const opt = new Option(c, c);
    countrySel.appendChild(opt);
  });

  // Country change → show UK/USA fields
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
  items.forEach(item => {
    const opt = new Option(item, item);
    sel.appendChild(opt);
  });
}

// Form Submit
document.getElementById('salaryForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;

  // Validate location
  const country = form.country.value;
  let region = '';
  let city = form.city.value.trim();

  if (country === 'United Kingdom') {
    region = form.county.value;
    if (!region || !city) return alert('Please select county and enter city.');
  } else if (country === 'United States') {
    region = form.state.value;
    if (!region || !city) return alert('Please select state and enter city.');
  }

  const data = {
    id: Date.now().toString(),
    title: form.title.value,
    country: country,
    region: region,
    city: city,
    salary: form.salary.value,
    timeInRole: form.timeInRole.value,
    education: form.education.value,
    sector: form.sector.value,
    companySize: form.companySize.value,
    workArrangement: form.workArrangement.value,
    certification: form.certification.value.trim(),
    benefits: form.benefits.value.trim(),
    submittedAt: new Date().toISOString()
  };

  // Send email
  try {
    await fetch(CONFIG.FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        _subject: `New QS Salary: ${data.title} in ${data.city}, ${data.country}`,
        _email: 'no-reply@qssalaryindex.com'
      })
    });
  } catch (err) {
    console.warn('Email failed:', err);
  }

  // Save pending
  const pending = await fetchPending();
  pending.push(data);
  downloadJson(pending, 'pending.json');

  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green">
      Submitted! Awaiting admin approval.<br>
      <small>Check your email. Admin has been notified.</small>
    </p>`;
  form.reset();
  document.getElementById('ukFields').style.display = 'none';
  document.getElementById('usaFields').style.display = 'none';
};

async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    return await res.json();
  } catch {
    return [];
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
