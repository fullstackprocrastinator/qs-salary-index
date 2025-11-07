// Populate country dropdown
document.addEventListener('DOMContentLoaded', () => {
  const countrySel = document.getElementById('country');
  CONFIG.COUNTRIES.forEach(c => {
    const opt = new Option(c, c);
    countrySel.appendChild(opt);
  });

  // UK / USA location logic
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

// Submit form
document.getElementById('salaryForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    id: Date.now().toString(),
    title: form.title.value,
    country: form.country.value,
    region: form.county?.value || form.state?.value || '',
    city: form.city.value.trim(),
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

  // Send email via Formspree
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
    console.warn('Formspree failed:',88 err);
  }

  // Save to pending.json (download)
  const pending = await fetchPending();
  pending.push(data);
  downloadJson(pending, 'pending.json');

  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green">
      Submitted! Awaiting approval.<br>
      <small>You'll get an email. Admin will review.</small>
    </p>`;
  form.reset();
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
