/* --------------------------------------------------------------
   The QS Salary Index – Submit Form (Fixed Formspree)
   -------------------------------------------------------------- */
(() => {
  'use strict';

  // === CONFIG WITH CACHE BUSTER ===
  const CONFIG_URL = 'assets/js/config.js?t=' + Date.now();

  // Load config with cache-buster
  const script = document.createElement('script');
  script.src = CONFIG_URL;
  script.onload = initForm;
  script.onerror = () => showError('Failed to load config. Please refresh.');
  document.head.appendChild(script);

  function initForm() {
    const form = document.getElementById('salaryForm');
    const countrySel = document.getElementById('country');
    const ukSubSel = document.getElementById('ukSub');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Reset form on load
    form.reset();
    resetRequiredFields();

    // Bind events safely
    form.addEventListener('submit', handleSubmit, false);
    countrySel.addEventListener('change', handleCountryChange, false);
    if (ukSubSel) ukSubSel.addEventListener('change', handleUKSubChange, false);

    // Mobile Firefox touch fallback
    submitBtn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

    // Populate countries
    CONFIG.COUNTRIES.forEach(c => countrySel.appendChild(new Option(c, c)));
  }

  // === HANDLE SUBMIT ===
  function handleSubmit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const form = e?.target || document.getElementById('salaryForm');
    if (!form) return;

    submitForm(form).catch(err => {
      console.error('Submit error:', err);
      showError('Submission failed. Please try again or email us.');
    });
  }

  async function submitForm(form) {
    const country = form.country.value;
    let region = '', city = '';

    // === VALIDATE & COLLECT LOCATION ===
    if (country === 'United Kingdom') {
      const ukSub = form.ukSub?.value;
      if (!ukSub) return showError('Please select England, Scotland, or Wales.');

      if (ukSub === 'england') {
        region = form.county?.value || '';
        city = document.getElementById('englandCity')?.value.trim();
      } else if (ukSub === 'scotland') {
        region = form.scotlandRegion?.value || '';
        city = document.getElementById('scotlandCity')?.value.trim();
      } else if (ukSub === 'wales') {
        region = form.walesRegion?.value || '';
        city = document.getElementById('walesCity')?.value.trim();
      }

      if (!city) return showError('Please enter city.');

    } else if (country === 'United States') {
      region = form.state.value;
      city = document.getElementById('usaCity')?.value.trim();
      if (!region || !city) return showError('Please select state and enter city.');
    } else {
      city = document.getElementById('otherCity')?.value.trim();
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

    /* ---- SEND VIA FORMSPREE (FORM-URLENCODED) ---- */
    if (CONFIG.FORMSPREE_ENDPOINT && !CONFIG.FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
      try {
        const formData = new URLSearchParams();
        formData.append('_subject', `New QS Salary – ${data.title} in ${data.city}`);
        formData.append('message', 'A new salary entry has been submitted.\n\nAttached: pending.json');
        formData.append('pending.json', jsonStr);
        Object.keys(data).forEach(key => formData.append(key, data[key]));

        const resp = await fetch(CONFIG.FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        showSuccess();
      } catch (err) {
        console.error('Submission failed:', err);
        showError(`Submission failed: ${err.message}. Please email us.`);
      }
    } else {
      showError('Formspree not configured. Please email theqssalaryindex@outlook.com');
    }

    // === RESET FORM ===
    form.reset();
    ['ukSubFields', 'englandFields', 'scotlandFields', 'walesFields', 'usaFields', 'otherFields'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    resetRequiredFields();
  }

  // === SIMPLE SUCCESS MESSAGE ===
  function showSuccess() {
    document.getElementById('submitMsg').innerHTML = `
      <div style="
        background:#ecfdf5;color:#065f46;padding:1.2rem;border-radius:12px;
        border:1px solid #a7f3d0;font-weight:500;margin-top:1rem;line-height:1.5;
      ">
        <strong>Thank you!</strong><br>
        Your salary has been submitted and will be live within 24 hours.<br>
        <small>— The QS Collection</small>
      </div>`;
  }

  // === ERROR MESSAGE ===
  function showError(msg) {
    document.getElementById('submitMsg').innerHTML = `
      <div style="
        background:#fef2f2;color:#991b1b;padding:1rem;border-radius:8px;
        border:1px solid #fca5a5;font-weight:500;margin-top:1rem;
      ">
        <strong>Error:</strong> ${msg}<br>
        <small>Please try again or contact support.</small>
      </div>`;
  }

  // === COUNTRY CHANGE ===
  function handleCountryChange() {
    const selected = this.value;

    ['ukSubFields', 'englandFields', 'scotlandFields', 'walesFields', 'usaFields', 'otherFields'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    resetRequiredFields();

    if (!selected) return;

    if (selected === 'United Kingdom') {
      document.getElementById('ukSubFields').style.display = 'block';
      document.getElementById('ukSub').value = '';
    } else if (selected === 'United States') {
      document.getElementById('usaFields').style.display = 'block';
      populateSelect('state', CONFIG.USA_STATES);
      document.getElementById('state').required = true;
      setCityRequired('usaCity');
    } else {
      document.getElementById('otherFields').style.display = 'block';
      setCityRequired('otherCity');
    }
  }

  // === UK SUB-REGION CHANGE ===
  function handleUKSubChange() {
    const sub = this.value;

    ['englandFields', 'scotlandFields', 'walesFields'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    resetRequiredFields();

    if (sub === 'england') {
      document.getElementById('englandFields').style.display = 'block';
      populateSelect('county', CONFIG.UK_COUNTIES);
      setCityRequired('englandCity');
    } else if (sub === 'scotland') {
      document.getElementById('scotlandFields').style.display = 'block';
      populateSelect('scotlandRegion', CONFIG.SCOTLAND_COUNCIL_AREAS);
      setCityRequired('scotlandCity');
    } else if (sub === 'wales') {
      document.getElementById('walesFields').style.display = 'block';
      populateSelect('walesRegion', CONFIG.WALES_PRINCIPAL_AREAS);
      setCityRequired('walesCity');
    }
  }

  // === HELPER: Set required on active city field only ===
  function setCityRequired(activeId) {
    ['englandCity', 'scotlandCity', 'walesCity', 'usaCity', 'otherCity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = false;
    });
    const active = document.getElementById(activeId);
    if (active) active.required = true;
  }

  function resetRequiredFields() {
    setCityRequired(null);
    const stateSel = document.getElementById('state');
    if (stateSel) stateSel.required = false;
  }

  function populateSelect(id, items) {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Select (optional)...</option>';
    items.forEach(item => sel.appendChild(new Option(item, item)));
  }

  async function fetchPending() {
    try {
      const res = await fetch(CONFIG.PENDING_URL + '?t=' + Date.now());
      return res.ok ? await res.json() : [];
    } catch (err) {
      console.warn('Could not load pending.json:', err);
      return [];
    }
  }

  // Expose for debugging
  window.QS_SUBMIT_DEBUG = { showSuccess, showError };
})();
