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
const chooseFolderBtn = document.getElementById('choose-folder');
const folderDisplay = document.getElementById('folder-display');
let editingMedId = null;

// LocalStorage Helpers
function getMeds() { return JSON.parse(localStorage.getItem('meds') || '[]'); }
function saveMeds(meds) {
  localStorage.setItem('meds', JSON.stringify(meds));
  backupData();
}
function getMedLogs() { return JSON.parse(localStorage.getItem('medLogs') || '{}'); }
function saveMedLogs(logs) {
  localStorage.setItem('medLogs', JSON.stringify(logs));
  backupData();
}
function getVitalsLogs() { return JSON.parse(localStorage.getItem('vitalsLogs') || '{}'); }
function saveVitalsLogs(logs) {
  localStorage.setItem('vitalsLogs', JSON.stringify(logs));
  backupData();
}

// --- File System Access API Backup ---
let folderHandle = null;
let fallbackAlertShown = false;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rx-tracker', 1);
    request.onupgradeneeded = e => {
      e.target.result.createObjectStore('handles');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDirHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'dir');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadDirHandle() {
  const db = await openDB();
  return new Promise(resolve => {
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get('dir');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function clearDirHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').delete('dir');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function backupData() {
  if (!folderHandle) return;
  try {
    const fileHandle = await folderHandle.getFileHandle('rxtracker-data.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify({
      meds: getMeds(),
      medLogs: getMedLogs(),
      vitalsLogs: getVitalsLogs()
    }, null, 2));
    await writable.close();
  } catch (err) {
    console.error('Failed to backup data', err);
    if (!fallbackAlertShown) {
      alert('Lost access to the chosen folder. Using local storage instead.');
      fallbackAlertShown = true;
    }
    folderHandle = null;
    folderDisplay.textContent = '';
    clearDirHandle();
  }
}

async function restoreFromFile() {
  if (!folderHandle) return;
  try {
    const fileHandle = await folderHandle.getFileHandle('rxtracker-data.json');
    const file = await fileHandle.getFile();
    const data = JSON.parse(await file.text());
    if (data.meds) saveMeds(data.meds);
    if (data.medLogs) saveMedLogs(data.medLogs);
    if (data.vitalsLogs) saveVitalsLogs(data.vitalsLogs);
  } catch (err) {
    if (!fallbackAlertShown) {
      alert('Could not read data from the chosen folder. Using local storage instead.');
      fallbackAlertShown = true;
    }
    folderHandle = null;
    folderDisplay.textContent = '';
    clearDirHandle();
  }
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    alert('File System Access API not supported. Using local storage only.');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker();
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      folderHandle = handle;
      folderDisplay.textContent = handle.name;
      await saveDirHandle(handle);
      await backupData();
      fallbackAlertShown = false;
    }
  } catch (err) {
    console.error(err);
  }
}

chooseFolderBtn.addEventListener('click', chooseFolder);

// Utility to return today's date in the user's local timezone
function getTodayString() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

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
  const today = getTodayString();
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
  const today = getTodayString();
  logs[today] = { systolic, diastolic, heartRate: hr };
  saveVitalsLogs(logs);
  renderVitals();
  vitalsForm.reset();
});

editVitalsBtn.addEventListener('click', () => {
  const logs = getVitalsLogs();
  const today = getTodayString();
  const v = logs[today];
  if (!v) return;
  document.getElementById('systolic').value = v.systolic;
  document.getElementById('diastolic').value = v.diastolic;
  document.getElementById('heart-rate').value = v.heartRate;
});

function renderVitals() {
  const logs = getVitalsLogs();
  const today = getTodayString();
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
async function init() {
  const storedHandle = await loadDirHandle();
  if (storedHandle && !window.showDirectoryPicker) {
    alert('File System Access API not available. Using local storage instead.');
  }
  if (storedHandle && window.showDirectoryPicker) {
    folderHandle = storedHandle;
    let perm = await folderHandle.queryPermission({ mode: 'readwrite' });
    if (perm === 'prompt') {
      perm = await folderHandle.requestPermission({ mode: 'readwrite' });
    }
    if (perm === 'granted') {
      folderDisplay.textContent = folderHandle.name;
      await restoreFromFile();
    } else {
      alert('Could not access the chosen folder. Using local storage instead.');
      folderHandle = null;
      folderDisplay.textContent = '';
    }
  }
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
