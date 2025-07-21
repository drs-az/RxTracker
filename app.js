// DOM Elements
const medForm = document.getElementById('med-form');
const medList = document.getElementById('med-list');
const timeInputsDiv = document.getElementById('time-inputs');
const addTimeBtn = document.getElementById('add-time');
const todayDateSpan = document.getElementById('today-date');
const logList = document.getElementById('log-list');
const vitalsForm = document.getElementById('vitals-form');
const vitalsDisplay = document.getElementById('vitals-display');
const historySelect = document.getElementById('history-med-select');
const historyTableBody = document.querySelector('#history-table tbody');
const bpCanvas = document.getElementById('bp-chart');
const hrCanvas = document.getElementById('hr-chart');
const downloadBpBtn = document.getElementById('download-bp');
const downloadHrBtn = document.getElementById('download-hr');
const navButtons = document.querySelectorAll('#bottom-nav button');
const medSubmitBtn = medForm.querySelector('button[type="submit"]');
const editVitalsBtn = document.getElementById('edit-vitals');
let editingMedId = null;

// LocalStorage Helpers
function getMeds() { return JSON.parse(localStorage.getItem('meds') || '[]'); }
function saveMeds(meds) { localStorage.setItem('meds', JSON.stringify(meds)); }
function getMedLogs() { return JSON.parse(localStorage.getItem('medLogs') || '{}'); }
function saveMedLogs(logs) { localStorage.setItem('medLogs', JSON.stringify(logs)); }
function getVitalsLogs() { return JSON.parse(localStorage.getItem('vitalsLogs') || '{}'); }
function saveVitalsLogs(logs) { localStorage.setItem('vitalsLogs', JSON.stringify(logs)); }

// Add time input field
addTimeBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'time';
  input.required = true;
  timeInputsDiv.appendChild(input);
});

// Save new medication/vitamin
medForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('med-name').value;
  const dose = document.getElementById('med-dose').value;
  const times = Array.from(timeInputsDiv.querySelectorAll('input')).map(i => i.value);
  const meds = getMeds();

  if (editingMedId) {
    const med = meds.find(m => m.id === editingMedId);
    if (med) {
      med.name = name;
      med.dose = dose;
      med.times = times;
    }
  } else {
    meds.push({ id: Date.now(), name, dose, times });
  }

  saveMeds(meds);
  renderMeds();
  medForm.reset();
  medSubmitBtn.textContent = 'Save Medication';
  editingMedId = null;
  timeInputsDiv.innerHTML = '';
});

// Render saved medications
function renderMeds() {
  medList.innerHTML = '';
  getMeds().forEach(m => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = `${m.name} - ${m.dose} at ${m.times.join(', ')}`;
    li.appendChild(span);
    const btn = document.createElement('button');
    btn.textContent = 'Edit';
    btn.addEventListener('click', () => startEditMed(m.id));
    li.appendChild(btn);
    medList.appendChild(li);
  });
}

function startEditMed(id) {
  const med = getMeds().find(m => m.id === id);
  if (!med) return;
  editingMedId = id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-dose').value = med.dose;
  timeInputsDiv.innerHTML = '';
  med.times.forEach(t => {
    const input = document.createElement('input');
    input.type = 'time';
    input.required = true;
    input.value = t;
    timeInputsDiv.appendChild(input);
  });
  medSubmitBtn.textContent = 'Update Medication';
}

// Render today's medication log
function renderLog() {
  const today = new Date().toISOString().split('T')[0];
  todayDateSpan.textContent = today;
  const logs = getMedLogs();
  const todayLogs = logs[today] || [];
  logList.innerHTML = '';

  getMeds().forEach(m => {
    m.times.forEach(time => {
      const entry = todayLogs.find(l => l.medId === m.id && l.time === time) || {};
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = entry.taken || false;
      cb.addEventListener('change', () => {
        const allLogs = getMedLogs();
        if (!allLogs[today]) allLogs[today] = [];
        const dayLogs = allLogs[today];
        const existing = dayLogs.find(l => l.medId === m.id && l.time === time);
        if (existing) {
          existing.taken = cb.checked;
        } else {
          dayLogs.push({ medId: m.id, time, taken: cb.checked });
        }
        saveMedLogs(allLogs);
      });
      li.appendChild(cb);
      li.append(` ${time} - ${m.name} (${m.dose})`);
      logList.appendChild(li);
    });
  });
}

// Vitals logging
vitalsForm.addEventListener('submit', e => {
  e.preventDefault();
  const systolic = document.getElementById('systolic').value;
  const diastolic = document.getElementById('diastolic').value;
  const hr = document.getElementById('heart-rate').value;
  const logs = getVitalsLogs();
  const today = new Date().toISOString().split('T')[0];
  logs[today] = { systolic, diastolic, heartRate: hr };
  saveVitalsLogs(logs);
  renderVitals();
  vitalsForm.reset();
});

editVitalsBtn.addEventListener('click', () => {
  const logs = getVitalsLogs();
  const today = new Date().toISOString().split('T')[0];
  const v = logs[today];
  if (!v) return;
  document.getElementById('systolic').value = v.systolic;
  document.getElementById('diastolic').value = v.diastolic;
  document.getElementById('heart-rate').value = v.heartRate;
});

function renderVitals() {
  const logs = getVitalsLogs();
  const today = new Date().toISOString().split('T')[0];
  const v = logs[today];
  if (v) {
    vitalsDisplay.innerHTML =
      `<p>BP: ${v.systolic}/${v.diastolic} mmHg</p><p>HR: ${v.heartRate} bpm</p>`;
    editVitalsBtn.style.display = 'block';
  } else {
    vitalsDisplay.innerHTML = '';
    editVitalsBtn.style.display = 'none';
  }
}

function showSection(id) {
  document.querySelectorAll('section').forEach(sec => {
    sec.style.display = sec.id === id ? 'block' : 'none';
  });
  if (id === 'tracker') {
    renderTracker();
  } else if (id === 'today-log') {
    renderLog();
    renderVitals();
  }
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.target));
});

function renderTracker() {
  const meds = getMeds();
  historySelect.innerHTML = '';
  meds.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    historySelect.appendChild(opt);
  });
  if (meds.length) loadMedHistory(meds[0].id);
  drawVitalsCharts();
}

historySelect.addEventListener('change', () => loadMedHistory(historySelect.value));

function loadMedHistory(id) {
  const med = getMeds().find(m => m.id == id);
  if (!med) return;
  const logs = getMedLogs();
  historyTableBody.innerHTML = '';
  const dates = Object.keys(logs).sort();
  dates.forEach(date => {
    med.times.forEach(time => {
      const entry = (logs[date] || []).find(l => l.medId == med.id && l.time === time);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${date}</td><td>${time}</td><td>${entry && entry.taken ? 'Yes' : 'No'}</td>`;
      historyTableBody.appendChild(tr);
    });
  });
}

function drawLineChart(canvas, labels, datasets, opts = {}) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  const all = datasets.flatMap(d => d.data).map(Number);
  if (!all.length) return;
  const minY = Math.min(...all);
  const maxY = Math.max(...all);

  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + height);
  ctx.lineTo(padding + width, padding + height);
  ctx.stroke();

  const stepX = labels.length > 1 ? width / (labels.length - 1) : width;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((lab, i) => {
    const x = padding + (labels.length > 1 ? i * stepX : width / 2);
    ctx.fillText(lab, x, padding + height + 12);
  });

  const ticks = 5;
  ctx.textAlign = 'right';
  for (let i = 0; i <= ticks; i++) {
    const val = minY + (maxY - minY) * (i / ticks);
    const y = padding + height - (maxY - minY === 0 ? 0 : (val - minY) / (maxY - minY) * height);
    ctx.fillText(Math.round(val), padding - 5, y + 3);
    ctx.beginPath();
    ctx.moveTo(padding - 3, y);
    ctx.lineTo(padding, y);
    ctx.stroke();
  }

  datasets.forEach(ds => {
    ctx.strokeStyle = ds.color;
    ctx.fillStyle = ds.color;
    ctx.beginPath();
    ds.data.forEach((val, i) => {
      const x = padding + (labels.length > 1 ? i * stepX : width / 2);
      const y = padding + height - (maxY - minY === 0 ? 0 : (val - minY) / (maxY - minY) * height);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ds.data.forEach((val, i) => {
      const x = padding + (labels.length > 1 ? i * stepX : width / 2);
      const y = padding + height - (maxY - minY === 0 ? 0 : (val - minY) / (maxY - minY) * height);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.textAlign = 'center';
  if (opts.xLabel) {
    ctx.fillText(opts.xLabel, padding + width / 2, canvas.height - 5);
  }
  if (opts.yLabel) {
    ctx.save();
    ctx.translate(12, padding + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }
}

function drawVitalsCharts() {
  const logs = getVitalsLogs();
  const dates = Object.keys(logs).sort();
  const systolic = dates.map(d => Number(logs[d].systolic));
  const diastolic = dates.map(d => Number(logs[d].diastolic));
  const hr = dates.map(d => Number(logs[d].heartRate));
  drawLineChart(bpCanvas, dates, [
    { data: systolic, color: 'red' },
    { data: diastolic, color: 'blue' }
  ], {
    xLabel: 'Date',
    yLabel: 'mmHg'
  });
  drawLineChart(hrCanvas, dates, [
    { data: hr, color: 'green' }
  ], {
    xLabel: 'Date',
    yLabel: 'bpm'
  });
}

downloadBpBtn.addEventListener('click', () => {
  const url = bpCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blood_pressure.png';
  a.click();
});

downloadHrBtn.addEventListener('click', () => {
  const url = hrCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'heart_rate.png';
  a.click();
});

// Initialize app
function init() {
  renderMeds();
  renderLog();
  renderVitals();
  showSection('today-log');
}

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
  init();
});
