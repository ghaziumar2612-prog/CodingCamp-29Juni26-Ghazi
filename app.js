/* =============================================
   Personal Dashboard — app.js
   ============================================= */

// ─── Storage Helpers ──────────────────────────
const store = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
};

// ─── State ────────────────────────────────────
const state = {
  theme:          store.get('theme', 'light'),
  userName:       store.get('userName', ''),
  pomodoroMins:   store.get('pomodoroMins', 25),
  todos:          store.get('todos', []),
  links:          store.get('links', []),
  timerInterval:  null,
  timerRunning:   false,
  timerSeconds:   0,   // filled on init
  timerTotal:     0,   // filled on init
};

// ─── DOM Refs ─────────────────────────────────
const $ = id => document.getElementById(id);
const dom = {
  html:             document.documentElement,
  themeToggle:      $('theme-toggle'),
  settingsBtn:      $('settings-btn'),
  settingsModal:    $('settings-modal'),
  settingsSave:     $('settings-save'),
  settingsCancel:   $('settings-cancel'),
  userNameInput:    $('user-name-input'),
  pomodoroInput:    $('pomodoro-minutes-input'),
  clock:            $('clock'),
  dateDisplay:      $('date-display'),
  greeting:         $('greeting-text'),
  timerDisplay:     $('timer-display'),
  timerStart:       $('timer-start'),
  timerStop:        $('timer-stop'),
  timerReset:       $('timer-reset'),
  timerProgress:    $('timer-progress'),
  todoInput:        $('todo-input'),
  todoAdd:          $('todo-add'),
  todoList:         $('todo-list'),
  editModal:        $('edit-modal'),
  editTaskInput:    $('edit-task-input'),
  editSave:         $('edit-save'),
  editCancel:       $('edit-cancel'),
  linkNameInput:    $('link-name-input'),
  linkUrlInput:     $('link-url-input'),
  linkAdd:          $('link-add'),
  linksGrid:        $('links-grid'),
};

// ─── Theme ────────────────────────────────────
function applyTheme(theme) {
  dom.html.setAttribute('data-theme', theme);
  dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
  state.theme = theme;
}

dom.themeToggle.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

// ─── Clock & Greeting ─────────────────────────
function getGreeting(hour) {
  if (hour < 5)  return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function updateClock() {
  const now    = new Date();
  const h      = now.getHours();
  const m      = String(now.getMinutes()).padStart(2, '0');
  const s      = String(now.getSeconds()).padStart(2, '0');
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const h12    = String(h % 12 || 12).padStart(2, '0');

  dom.clock.textContent = `${h12}:${m}:${s} ${ampm}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  dom.dateDisplay.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const name  = state.userName ? `, ${state.userName}` : '';
  dom.greeting.textContent = `${getGreeting(h)}${name} 👋`;
}

setInterval(updateClock, 1000);
updateClock();

// ─── Settings Modal ───────────────────────────
dom.settingsBtn.addEventListener('click', () => {
  dom.userNameInput.value    = state.userName;
  dom.pomodoroInput.value    = state.pomodoroMins;
  dom.settingsModal.classList.remove('hidden');
});

dom.settingsCancel.addEventListener('click', () => dom.settingsModal.classList.add('hidden'));
dom.settingsModal.addEventListener('click', e => { if (e.target === dom.settingsModal) dom.settingsModal.classList.add('hidden'); });

dom.settingsSave.addEventListener('click', () => {
  const name = dom.userNameInput.value.trim();
  const mins = parseInt(dom.pomodoroInput.value, 10);

  state.userName = name;
  store.set('userName', name);

  if (!isNaN(mins) && mins >= 1 && mins <= 120) {
    state.pomodoroMins = mins;
    store.set('pomodoroMins', mins);
    if (!state.timerRunning) resetTimer();
  }

  dom.settingsModal.classList.add('hidden');
  updateClock();
});

// ─── Focus Timer ──────────────────────────────
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  dom.timerDisplay.textContent = formatTime(state.timerSeconds);
  const pct = state.timerTotal > 0 ? (state.timerSeconds / state.timerTotal) * 100 : 100;
  dom.timerProgress.style.width = `${pct}%`;
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerTotal   = state.pomodoroMins * 60;
  state.timerSeconds = state.timerTotal;
  dom.timerDisplay.classList.remove('running', 'finished');
  updateTimerUI();
}

dom.timerStart.addEventListener('click', () => {
  if (state.timerRunning) return;
  if (state.timerSeconds <= 0) resetTimer();
  state.timerRunning = true;
  dom.timerDisplay.classList.add('running');
  dom.timerDisplay.classList.remove('finished');

  state.timerInterval = setInterval(() => {
    state.timerSeconds--;
    updateTimerUI();
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      dom.timerDisplay.classList.remove('running');
      dom.timerDisplay.classList.add('finished');
      dom.timerDisplay.textContent = '00:00';
      // Notify user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus session complete! 🎉');
      } else {
        alert('Focus session complete! 🎉');
      }
    }
  }, 1000);
});

dom.timerStop.addEventListener('click', () => {
  if (!state.timerRunning) return;
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  dom.timerDisplay.classList.remove('running');
});

dom.timerReset.addEventListener('click', resetTimer);

// ─── To-Do List ───────────────────────────────
let editingIndex = null;

function saveTodos() { store.set('todos', state.todos); }

function renderTodos() {
  const list = dom.todoList;
  list.innerHTML = '';

  if (state.todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No tasks yet. Add one above!</li>';
    return;
  }

  state.todos.forEach((todo, i) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" aria-label="Mark complete" ${todo.done ? 'checked' : ''} data-idx="${i}" />
      <span class="task-text">${escapeHtml(todo.text)}</span>
      <div class="item-actions">
        <button class="btn" data-edit="${i}" aria-label="Edit task">✏️</button>
        <button class="btn btn-danger" data-del="${i}" aria-label="Delete task">🗑️</button>
      </div>`;
    list.appendChild(li);
  });
}

dom.todoList.addEventListener('change', e => {
  if (e.target.type === 'checkbox') {
    const i = parseInt(e.target.dataset.idx, 10);
    state.todos[i].done = e.target.checked;
    saveTodos();
    renderTodos();
  }
});

dom.todoList.addEventListener('click', e => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn  = e.target.closest('[data-del]');

  if (editBtn) {
    editingIndex = parseInt(editBtn.dataset.edit, 10);
    dom.editTaskInput.value = state.todos[editingIndex].text;
    dom.editModal.classList.remove('hidden');
    dom.editTaskInput.focus();
    dom.editTaskInput.select();
  }

  if (delBtn) {
    const i = parseInt(delBtn.dataset.del, 10);
    state.todos.splice(i, 1);
    saveTodos();
    renderTodos();
  }
});

function addTodo() {
  const text = dom.todoInput.value.trim();
  if (!text) return;
  state.todos.push({ text, done: false, id: Date.now() });
  saveTodos();
  renderTodos();
  dom.todoInput.value = '';
  dom.todoInput.focus();
}

dom.todoAdd.addEventListener('click', addTodo);
dom.todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

// Edit modal
dom.editSave.addEventListener('click', () => {
  const text = dom.editTaskInput.value.trim();
  if (text && editingIndex !== null) {
    state.todos[editingIndex].text = text;
    saveTodos();
    renderTodos();
  }
  dom.editModal.classList.add('hidden');
  editingIndex = null;
});

dom.editCancel.addEventListener('click', () => {
  dom.editModal.classList.add('hidden');
  editingIndex = null;
});

dom.editModal.addEventListener('click', e => {
  if (e.target === dom.editModal) {
    dom.editModal.classList.add('hidden');
    editingIndex = null;
  }
});

dom.editTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') dom.editSave.click(); });

// ─── Quick Links ──────────────────────────────
function saveLinks() { store.set('links', state.links); }

function renderLinks() {
  const grid = dom.linksGrid;
  grid.innerHTML = '';

  if (state.links.length === 0) {
    grid.innerHTML = '<p class="empty-state">No links yet. Add your favorites above!</p>';
    return;
  }

  state.links.forEach((link, i) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';
    chip.innerHTML = `
      <img src="https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(link.url)}" 
           alt="" width="16" height="16" onerror="this.style.display='none'" />
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.name)}</a>
      <button class="link-delete" data-del="${i}" aria-label="Remove link">✕</button>`;
    grid.appendChild(chip);
  });
}

dom.linksGrid.addEventListener('click', e => {
  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    const i = parseInt(delBtn.dataset.del, 10);
    state.links.splice(i, 1);
    saveLinks();
    renderLinks();
  }
});

function addLink() {
  const name = dom.linkNameInput.value.trim();
  let   url  = dom.linkUrlInput.value.trim();

  if (!name || !url) { alert('Please fill in both label and URL.'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  state.links.push({ name, url });
  saveLinks();
  renderLinks();
  dom.linkNameInput.value = '';
  dom.linkUrlInput.value  = '';
  dom.linkNameInput.focus();
}

dom.linkAdd.addEventListener('click', addLink);
dom.linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

// ─── Helpers ──────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}

// ─── Init ─────────────────────────────────────
function init() {
  applyTheme(state.theme);
  resetTimer();
  renderTodos();
  renderLinks();

  // Request notification permission for timer
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

init();
