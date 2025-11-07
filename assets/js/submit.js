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

  // Save to pending.json
  const pending = await fetchPending();
  pending.push(data);
  await savePending(pending);

  document.getElementById('submitMsg').innerHTML = '<p style="color:green">Submitted! Awaiting admin approval.</p>';
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

async function savePending(data) {
  // GitHub Pages can't write — so we use a trick: open edit link
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pending.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  alert('Download pending.json and upload it to /assets/data/pending.json via GitHub (replace file).');
}
