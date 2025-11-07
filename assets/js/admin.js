const ADMIN_PASS = 'qsadmin2025'; // Change this!

document.getElementById('loginBtn').onclick = () => {
  if (document.getElementById('adminPass').value === ADMIN_PASS) {
    document.getElementById('adminArea').style.display = 'block';
    loadPending();
    loadLive();
  } else {
    alert('Wrong password');
  }
};

async function loadPending() {
  const pending = await fetchJson(CONFIG.PENDING_URL);
  const list = document.getElementById('pendingList');
  document.getElementById('pendingCount').textContent = pending.length;

  if (pending.length === 0) {
    list.innerHTML = '<p>No pending submissions.</p>';
    return;
  }

  list.innerHTML = pending.map((s, i) => `
    <div class="pending-item">
      <strong>${s.title}</strong> in ${s.city}, ${s.country} – £${s.salary}
      <button onclick="approve(${i})">Approve</button>
      <button onclick="reject(${i})" style="background:red">Reject</button>
    </div>
  `).join('');
}

async function loadLive() {
  const live = await fetchJson(CONFIG.DATA_URL);
  document.getElementById('liveCount').textContent = live.length;
  document.getElementById('downloadLive').onclick = () => {
    downloadJson(live, 'salaries.json');
  };
}

async function fetchJson(url) {
  try {
    const res = await fetch(url + '?t=' + Date.now());
    return await res.json();
  } catch {
    return [];
  }
}

window.approve = async (index) => {
  const pending = await fetchJson(CONFIG.PENDING_URL);
  const item = pending.splice(index, 1)[0];
  const live = await fetchJson(CONFIG.DATA_URL);
  delete item.submittedAt;
  live.push(item);
  downloadJson(pending, 'pending.json');
  downloadJson(live, 'salaries.json');
  alert('Approved! Now upload both new JSON files to GitHub.');
  loadPending();
};

window.reject = (index) => {
  if (confirm('Reject this submission?')) {
    // Just remove
    fetchJson(CONFIG.PENDING_URL).then(pending => {
      pending.splice(index, 1);
      downloadJson(pending, 'pending.json');
      alert('Rejected. Upload new pending.json');
      loadPending();
    });
  }
};

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
