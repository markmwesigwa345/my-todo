/* ── State ── */
let todos = [];
let activeFilter = 'all';

/* ── Helpers ── */
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
}

function getPeriod(time) {
  if (!time) return 'unscheduled';
  const h = parseInt(time.split(':')[0]);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function periodLabel(p) {
  return { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening', unscheduled: '📌 Unscheduled' }[p];
}

/* ── CSRF ── */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/* ── Filter ── */
function applyFilter(list) {
  switch (activeFilter) {
    case 'pending':   return list.filter(t => !t.done);
    case 'done':      return list.filter(t => t.done);
    case 'morning':   return list.filter(t => getPeriod(t.time) === 'morning');
    case 'afternoon': return list.filter(t => getPeriod(t.time) === 'afternoon');
    case 'evening':   return list.filter(t => getPeriod(t.time) === 'evening');
    default:          return list;
  }
}

/* ── Render ── */
function render() {
  const area = document.getElementById('list-area');
  const sorted = [...todos].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  const filtered = applyFilter(sorted);

  /* Stats */
  const total = todos.length;
  const done  = todos.filter(t => t.done).length;
  const left  = total - done;
  const pct   = total ? Math.round(done / total * 100) : 0;
  const circ  = 131.9;
  const offset = circ - (circ * pct / 100);

  document.getElementById('ring-fill').style.strokeDashoffset = offset;
  document.getElementById('ring-pct').textContent = pct + '%';
  document.getElementById('pill-total').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>${total} task${total !== 1 ? 's' : ''}`;
  document.getElementById('pill-done').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
      <polyline points="20 6 9 17 4 12"/>
    </svg>${done} done`;
  document.getElementById('pill-left').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>${left} left`;

  /* Empty state */
  if (!filtered.length) {
    area.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <p>${activeFilter === 'all' ? 'No tasks yet' : 'Nothing here'}</p>
        <span>${activeFilter === 'all' ? 'Add your first task above!' : 'Try a different filter.'}</span>
      </div>`;
    return;
  }

  /* Group by time period */
  const groups = {};
  filtered.forEach(t => {
    const p = getPeriod(t.time);
    if (!groups[p]) groups[p] = [];
    groups[p].push(t);
  });

  const order = ['morning', 'afternoon', 'evening', 'unscheduled'];
  let html = '';

  order.forEach(period => {
    if (!groups[period]) return;
    html += `<div class="time-group-label">${periodLabel(period)}</div>`;
    groups[period].forEach(t => {
      const p = getPeriod(t.time);
      const tagClass = ['morning','afternoon','evening'].includes(p) ? p : '';
      html += `
        <li class="todo-item${t.done ? ' done' : ''}" id="item-${t.id}" role="listitem">
          <button class="check-btn${t.done ? ' checked' : ''}"
            onclick="toggle(${t.id})"
            aria-label="${t.done ? 'Mark as pending' : 'Mark as done'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <div class="todo-info">
            <div class="todo-text">${escHtml(t.text)}</div>
            <div class="todo-meta">
              ${t.time ? `
              <div class="todo-time">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                ${fmt12(t.time)}
              </div>
              ${tagClass ? `<span class="time-tag ${tagClass}">${tagClass}</span>` : ''}
              ` : ''}
            </div>
          </div>
          <button class="delete-btn" onclick="remove(${t.id})" aria-label="Delete task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </li>`;
    });
  });

  area.innerHTML = html;
}

/* ── API Actions ── */
async function loadTodos() {
  const res = await fetch('/api/tasks/');
  if (!res.ok) return;
  todos = await res.json();
  render();
}

async function addTodo() {
  const input = document.getElementById('task-input');
  const timeI = document.getElementById('time-input');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }
  await fetch('/api/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
    body: JSON.stringify({ text, time: timeI.value || null }),
  });
  input.value = '';
  input.focus();
  await loadTodos();
  showToast('Task added!');
}

async function toggle(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  await fetch(`/api/tasks/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
    body: JSON.stringify({ done: !t.done }),
  });
  await loadTodos();
  showToast(t.done ? '↩ Task moved back to pending' : '✓ Task marked done');
}

async function remove(id) {
  await fetch(`/api/tasks/${id}/`, {
    method: 'DELETE',
    headers: { 'X-CSRFToken': getCookie('csrftoken') },
  });
  await loadTodos();
  showToast('Task deleted');
}

function setFilter(f, btn) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── Init ── */
document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

const now = new Date();
document.getElementById('date-label').textContent =
  now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const nextHour = new Date(now.getTime() + 3600000);
nextHour.setMinutes(0, 0, 0);
document.getElementById('time-input').value =
  `${String(nextHour.getHours()).padStart(2,'0')}:00`;

loadTodos();