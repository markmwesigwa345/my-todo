
  /* ── Data ── */
  let todos = [
    { id: 1, text: "Morning run",           time: "06:30", done: true  },
    { id: 2, text: "Review design files",   time: "09:00", done: false },
    { id: 3, text: "Team standup",          time: "10:00", done: false },
    { id: 4, text: "Lunch break",           time: "13:00", done: true  },
    { id: 5, text: "Work on Django backend",time: "15:00", done: false },
    { id: 6, text: "Read about Django views",time: "17:30", done: false },
    { id: 7, text: "Evening walk",          time: "19:00", done: false },
  ];
  let nextId = 8;
  let activeFilter = 'all';

  /* ── Helpers ── */
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

  /* ── Filter logic ── */
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
        const period = getPeriod(t.time);
        const tagClass = ['morning','afternoon','evening'].includes(period) ? period : '';
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

  /* ── Actions ── */
  function toggle(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    render();
    showToast(t.done ? '✓ Task marked done' : '↩ Task moved back to pending');
  }

  function remove(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    todos = todos.filter(x => x.id !== id);
    render();
    showToast('Task deleted');
  }

  function addTodo() {
    const input = document.getElementById('task-input');
    const timeI = document.getElementById('time-input');
    const text = input.value.trim();
    if (!text) {
      input.focus();
      input.style.borderColor = 'var(--red)';
      setTimeout(() => input.style.borderColor = '', 1000);
      return;
    }
    todos.push({ id: nextId++, text, time: timeI.value, done: false });
    input.value = '';
    timeI.value = '';
    input.focus();
    render();
    showToast('Task added!');
  }

  function setFilter(f, btn) {
    activeFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  /* ── Toast ── */
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ── Escape HTML ── */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Keyboard: Enter to add ── */
  document.getElementById('task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
  });

  /* ── Date label ── */
  const now = new Date();
  document.getElementById('date-label').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ── Set default time to next round hour ── */
  const nextHour = new Date(now.getTime() + 3600000);
  nextHour.setMinutes(0, 0, 0);
  document.getElementById('time-input').value =
    `${String(nextHour.getHours()).padStart(2,'0')}:00`;

  /* ── Initial render ── */
  render();
