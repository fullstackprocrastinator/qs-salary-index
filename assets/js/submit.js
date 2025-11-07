document.getElementById('salaryForm').onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    id: Date.now().toString(),
    title: form.title.value.trim(),
    country: form.country.value,
    region: form.county?.value || form.state?.value || '',
    city: form.city.value.trim(),
    salary: form.salary.value.trim(),
    timeInRole: form.timeInRole.value,
    education: form.education.value,
    sector: form.sector.value,
    companySize: form.companySize.value,
    workArrangement: form.workArrangement.value,
    certification: form.certification.value.trim(),
    benefits: form.benefits.value.trim(),
    submittedAt: new Date().toISOString()
  };

  // 1. Send email via Formspree
  try {
    await fetch(CONFIG.FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        _subject: `New QS Salary Submission: ${data.title} in ${data.city}, ${data.country}`,
        _email: 'no-reply@qssalaryindex.com'
      })
    });
  } catch (err) {
    console.warn('Email failed (Formspree down)', err);
  }

  // 2. Save to pending.json (download)
  const pending = await fetchPending();
  pending.push(data);
  downloadJson(pending, 'pending.json');

  document.getElementById('submitMsg').innerHTML = `
    <p style="color:green">
      Submitted! Awaiting admin approval.<br>
      <small>Check your email – you’ve been notified.</small>
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
