// DOM Elements
const medForm = document.getElementById('med-form');
const medList = document.getElementById('med-list');
const timeInputsDiv = document.getElementById('time-inputs');
const addTimeBtn = document.getElementById('add-time');
const todayDateSpan = document.getElementById('today-date');
const logList = document.getElementById('log-list');
const vitalsForm = document.getElementById('vitals-form');
const vitalsDisplay = document.getElementById('vitals-display');

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
  meds.push({ id: Date.now(), name, dose, times });
  saveMeds(meds);
  renderMeds();
  medForm.reset();
  timeInputsDiv.innerHTML = '';
});

// Render saved medications
function renderMeds() {
  medList.innerHTML = '';
  getMeds().forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.name} - ${m.dose} at ${m.times.join(', ')}`;
    medList.appendChild(li);
  });
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

function renderVitals() {
  const logs = getVitalsLogs();
  const today = new Date().toISOString().split('T')[0];
  const v = logs[today];
  vitalsDisplay.innerHTML = v
    ? `<p>BP: ${v.systolic}/${v.diastolic} mmHg</p><p>HR: ${v.heartRate} bpm</p>`
    : '';
}

// Initialize app
function init() {
  renderMeds();
  renderLog();
  renderVitals();
}

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
  init();
});