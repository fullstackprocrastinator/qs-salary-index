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

  // Send email (if Formspree configured)
  if (CONFIG.FORMSPREE_ENDPOINT && CONFIG.FORMSPREE_ENDPOINT !== 'https://formspree.io/f/YOUR_FORM_ID') {
    try {
      const response = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',  // Fixed: Formspree expects this, not JSON
        },
        body: new URLSearchParams({
          ...data,
          _subject: `New QS Salary: ${data.title} in ${data.city}, ${data.country}`,
          _email: 'no-reply@qssalaryindex.com'  // Optional: your reply-to email
        }).toString()  // Convert to form-encoded
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log('Email sent via Formspree');
    } catch (err) {
      console.error('Formspree failed (check endpoint):', err);
      // Don't block submission – continue to download
    }
  } else {
    console.warn('Formspree not configured – skipping email. Update CONFIG.FORMSPREE_ENDPOINT.');
  }

  // Always save to pending.json (core workflow)
  try {
    const pending = await fetchPending();
    pending.push(data);
    downloadJson(pending, 'pending.json');
    console.log('pending.json downloaded successfully');
  } catch (err) {
    console.error('Download failed:', err);
    alert('Submission saved locally, but download error. Check console.');
  }

  // Show success + reset
  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green">
      ✅ Submitted! Download "pending.json" above.<br>
      <small>Upload to GitHub /assets/data/pending.json for approval. (Email skipped if not configured)</small>
    </p>`;
  form.reset();
  document.getElementById('ukFields').style.display = 'none';
  document.getElementById('usaFields').style.display = 'none';
};

async function fetchPending() {
  try {
    const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];  // Empty if file missing (normal at start)
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);  // Fix: Append to body for click
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
