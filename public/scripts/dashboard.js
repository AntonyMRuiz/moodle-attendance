const API_BASE = '';
let token = localStorage.getItem('token') || null;

let dailyChart = null;
let statusChart = null;

let campusesById = {};
let cohortsById = {};
let clansById = {};

let allStudents = [];
let currentCoderStats = null;
let currentSummary = null;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.json();
}

function ensureAuth() {
  if (!token) window.location.href = '/login.html';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-- %';
  return `${value.toFixed(1)} %`;
}

function badgeForStatus(status) {
  if (status === 'GOOD') {
    return `<span class="inline-flex px-2 py-1 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#065F46]">Bien</span>`;
  }
  if (status === 'WARNING') {
    return `<span class="inline-flex px-2 py-1 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E]">Alerta</span>`;
  }
  return `<span class="inline-flex px-2 py-1 rounded-full text-[10px] font-semibold bg-[#FEE2E2] text-[#991B1B]">Grave</span>`;
}

// ========== METADATA ==========

async function loadCampuses() {
  const campusSelect = document.getElementById('campusSelect');
  campusSelect.innerHTML = '<option value="">Selecciona una sede</option>';

  const campuses = await fetchJSON(`${API_BASE}/meta/campuses`, {
    headers: authHeaders()
  });

  campusesById = {};
  for (const c of campuses) {
    campusesById[c.id] = c;
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    campusSelect.appendChild(opt);
  }
}

async function loadCohorts() {
  const campusId = document.getElementById('campusSelect').value;
  const cohortSelect = document.getElementById('cohortSelect');
  cohortSelect.innerHTML = '<option value="">Selecciona una cohorte</option>';
  document.getElementById('clanSelect').innerHTML = '<option value="">Todos</option>';
  clansById = {};

  if (!campusId) return;

  const cohorts = await fetchJSON(
    `${API_BASE}/meta/cohorts?campusId=${encodeURIComponent(campusId)}`,
    { headers: authHeaders() }
  );

  cohortsById = {};
  for (const coh of cohorts) {
    cohortsById[coh.id] = coh;
    const opt = document.createElement('option');
    opt.value = coh.id;
    opt.textContent = coh.name;
    cohortSelect.appendChild(opt);
  }
}

async function loadClans() {
  const cohortId = document.getElementById('cohortSelect').value;
  const clanSelect = document.getElementById('clanSelect');
  clanSelect.innerHTML = '<option value="">Todos</option>';
  clansById = {};

  if (!cohortId) return;

  const clans = await fetchJSON(
    `${API_BASE}/meta/clans?cohortId=${encodeURIComponent(cohortId)}`,
    { headers: authHeaders() }
  );

  for (const cl of clans) {
    clansById[cl.id] = cl;
    const opt = document.createElement('option');
    opt.value = cl.id;
    opt.textContent = cl.name;
    clanSelect.appendChild(opt);
  }
}

// ========== SYNC DESDE MOODLE ==========

async function syncFromMoodle() {
  const btn = document.getElementById('syncBtn');
  const original = btn.textContent;
  btn.textContent = 'Sincronizando...';
  btn.disabled = true;

  try {
    await fetchJSON(`${API_BASE}/sync/attendance/all`, {
      method: 'POST',
      headers: authHeaders()
    });
  } catch (err) {
    console.error('Error sync:', err);
    alert('Error sincronizando desde Moodle. Revisa el backend.');
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

// ========== RANGO DE FECHAS ==========

function getRangeFromUI() {
  const mode = document.getElementById('viewMode').value;
  if (mode === 'week') {
    const start = document.getElementById('weekStart').value;
    if (!start) return null;
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const s = startDate.toISOString().slice(0, 10);
    const e = endDate.toISOString().slice(0, 10);
    return { start: s, end: e, mode: 'week' };
  } else {
    const monthStr = document.getElementById('monthInput').value; // YYYY-MM
    if (!monthStr) return null;
    const [y, m] = monthStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0); // último día
    const s = startDate.toISOString().slice(0, 10);
    const e = endDate.toISOString().slice(0, 10);
    return { start: s, end: e, mode: 'month' };
  }
}

// ========== RESUMEN (semana/mes) ==========

async function loadSummary() {
  const cohortId = document.getElementById('cohortSelect').value;
  const clanId = document.getElementById('clanSelect').value || '';
  const range = getRangeFromUI();

  const noSummaryMsg = document.getElementById('noSummaryMsg');
  const noSessionsMsg = document.getElementById('noSessionsMsg');
  const sessionsBody = document.getElementById('sessionsTableBody');
  const clanSummaryBody = document.getElementById('clanSummaryBody');

  noSummaryMsg.classList.add('hidden');
  noSessionsMsg.classList.add('hidden');
  sessionsBody.innerHTML = '';
  clanSummaryBody.innerHTML = '';

  if (!cohortId || !range) {
    setText('rangeLabel', 'Rango: --');
    updateDailyChart(null);
    setText('sessionsCountLabel', '0 sesiones');
    return;
  }

  setText('rangeLabel', `Rango: ${range.start} a ${range.end}`);

  try {
    const params = new URLSearchParams({
      start: range.start,
      end: range.end
    });
    if (clanId) params.append('clanId', clanId);

    const summary = await fetchJSON(
      `${API_BASE}/stats/cohort/${cohortId}/summary?${params.toString()}`,
      { headers: authHeaders() }
    );

    currentSummary = summary;

    // Daily chart
    if (!summary.daily || !summary.daily.length) {
      updateDailyChart(null);
      noSummaryMsg.textContent = 'No hay registros para el rango seleccionado.';
      noSummaryMsg.classList.remove('hidden');
    } else {
      updateDailyChart(summary.daily);
    }

    // Resumen por clan
    if (!summary.byClan || !summary.byClan.length) {
      clanSummaryBody.innerHTML = '';
    } else {
      for (const c of summary.byClan) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-3 py-2 text-slate-800">${c.clanName}</td>
          <td class="px-3 py-2 text-slate-600">${c.totalSessions}</td>
          <td class="px-3 py-2 text-slate-600">${c.present}</td>
          <td class="px-3 py-2 text-slate-600">${c.late}</td>
          <td class="px-3 py-2 text-slate-600">${c.justified}</td>
          <td class="px-3 py-2 text-slate-600">${c.unjustified}</td>
        `;
        clanSummaryBody.appendChild(tr);
      }
    }

    // Sesiones
    if (!summary.sessions || !summary.sessions.length) {
      setText('sessionsCountLabel', '0 sesiones');
      noSessionsMsg.textContent = 'No hay sesiones registradas para el rango seleccionado.';
      noSessionsMsg.classList.remove('hidden');
    } else {
      setText('sessionsCountLabel', `${summary.sessions.length} sesiones`);
      for (const s of summary.sessions) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="px-3 py-2 text-slate-700">${s.date}</td>
          <td class="px-3 py-2 text-slate-700">${s.clanName || 'Sin clan'}</td>
          <td class="px-3 py-2 text-slate-600">${s.description || ''}</td>
          <td class="px-3 py-2 text-slate-600">${s.present}</td>
          <td class="px-3 py-2 text-slate-600">${s.late}</td>
          <td class="px-3 py-2 text-slate-600">${s.justified}</td>
          <td class="px-3 py-2 text-slate-600">${s.unjustified}</td>
          <td class="px-3 py-2 text-slate-600">${s.totalStudents}</td>
          <td class="px-3 py-2">
            <a href="${s.moodleUrl}" target="_blank"
               class="text-xs text-[#6F48FF] hover:underline">
              Ver
            </a>
          </td>
        `;
        sessionsBody.appendChild(tr);
      }
    }
  } catch (err) {
    console.error('Error resumen:', err);
    noSummaryMsg.textContent = 'Error cargando el resumen.';
    noSummaryMsg.classList.remove('hidden');
  }
}

function updateDailyChart(dailyData) {
  const ctx = document.getElementById('dailyChart');
  if (!ctx) return;

  if (dailyChart) {
    dailyChart.destroy();
    dailyChart = null;
  }

  if (!dailyData || !dailyData.length) return;

  const labels = dailyData.map((d) => d.date);
  const present = dailyData.map((d) => d.present);
  const late = dailyData.map((d) => d.late);
  const fj = dailyData.map((d) => d.justified);
  const fi = dailyData.map((d) => d.unjustified);

  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'P', data: present },
        { label: 'R', data: late },
        { label: 'FJ', data: fj },
        { label: 'FI', data: fi }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 10 }, color: '#4B5563' }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 }, color: '#4B5563' }
        },
        y: {
          ticks: { font: { size: 10 }, color: '#4B5563' }
        }
      }
    }
  });
}

// ========== STATS CODERS ==========

async function loadCoderStats() {
  const cohortId = document.getElementById('cohortSelect').value;
  const noCoderDataMsg = document.getElementById('noCoderDataMsg');
  const tbody = document.getElementById('studentsTableBody');

  noCoderDataMsg.classList.add('hidden');
  tbody.innerHTML = '';
  allStudents = [];
  currentCoderStats = null;

  if (!cohortId) {
    updateCoderCards(null);
    updateStatusChart(null);
    setText('studentsCountLabel', '0 estudiantes');
    return;
  }

  try {
    const stats = await fetchJSON(`${API_BASE}/stats/cohort/${cohortId}`, {
      headers: authHeaders()
    });

    currentCoderStats = stats;
    allStudents = stats.students || [];

    updateCoderCards(stats);
    updateStatusChart(stats);
    renderCoderTable();

    if (!allStudents.length) {
      noCoderDataMsg.textContent =
        'No hay datos de estadística para la cohorte seleccionada.';
      noCoderDataMsg.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Error coder stats:', err);
    noCoderDataMsg.textContent = 'Error cargando stats de la cohorte.';
    noCoderDataMsg.classList.remove('hidden');
  }
}

function updateCoderCards(stats) {
  if (!stats) {
    setText('cardTotalStudents', '--');
    setText('cardAvgAttendance', '-- %');
    setText('cardGoodCount', '--');
    setText('cardOthersCount', '--');
    return;
  }

  const total = stats.totalStudents || 0;
  const avg = stats.attendancePercentage || 0;
  const good = stats.statusCount?.good || 0;
  const warning = stats.statusCount?.warning || 0;
  const bad = stats.statusCount?.bad || 0;

  setText('cardTotalStudents', total.toString());
  setText('cardAvgAttendance', formatPercent(avg));
  setText('cardGoodCount', good.toString());
  setText('cardOthersCount', (warning + bad).toString());
  setText('studentsCountLabel', `${stats.students.length} estudiante(s)`);
}

function updateStatusChart(stats) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  if (statusChart) {
    statusChart.destroy();
    statusChart = null;
  }

  if (!stats) return;

  const good = stats.statusCount?.good || 0;
  const warning = stats.statusCount?.warning || 0;
  const bad = stats.statusCount?.bad || 0;

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Bien', 'Alerta', 'Grave'],
      datasets: [
        {
          data: [good, warning, bad],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 1,
          borderColor: '#FFFFFF'
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10 },
            color: '#4B5563'
          }
        }
      }
    }
  });
}

function renderCoderTable() {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';

  let data = [...allStudents];
  data.sort((a, b) => b.percentage - a.percentage);

  data.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';

    tr.innerHTML = `
      <td class="px-3 py-2 text-slate-500">${idx + 1}</td>
      <td class="px-3 py-2 text-slate-800">${s.fullname}</td>
      <td class="px-3 py-2 text-slate-800 font-semibold">${s.percentage}%</td>
      <td class="px-3 py-2">${badgeForStatus(s.status)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ========== EVENTOS UI ==========

function setupEvents() {
  document.getElementById('campusSelect').addEventListener('change', async () => {
    await loadCohorts();
    await loadClans();
    await loadCoderStats();
  });

  document.getElementById('cohortSelect').addEventListener('change', async () => {
    await loadClans();
    await loadCoderStats();
  });

  document.getElementById('viewMode').addEventListener('change', () => {
    const mode = document.getElementById('viewMode').value;
    const weekWrapper = document.getElementById('weekWrapper');
    const monthWrapper = document.getElementById('monthWrapper');

    if (mode === 'week') {
      weekWrapper.classList.remove('hidden');
      monthWrapper.classList.add('hidden');
    } else {
      weekWrapper.classList.add('hidden');
      monthWrapper.classList.remove('hidden');
    }
  });

  document.getElementById('clanSelect').addEventListener('change', () => {
    loadSummary().catch(console.error);
  });

  document.getElementById('loadSummaryBtn').addEventListener('click', () => {
    loadSummary().catch(console.error);
  });

  document.getElementById('syncBtn').addEventListener('click', async () => {
    await syncFromMoodle();
    await loadSummary();
    await loadCoderStats();
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  });
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', async () => {
  ensureAuth();
  setupEvents();

  // set defaults para week y month
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  document.getElementById('weekStart').value = isoToday;

  const monthStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}`;
  document.getElementById('monthInput').value = monthStr;

  try {
    await loadCampuses();
  } catch (err) {
    console.error('Error cargando sedes:', err);
  }
});
