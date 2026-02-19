/* ═══════════════════════════════════════════════════════════════════
   themes.js – Dark / Light mode & colour theme management
═══════════════════════════════════════════════════════════════════ */

const COLOR_THEMES = {
  sky:     { label: 'Himmel',    primary: '#0ea5e9' },
  violet:  { label: 'Violett',   primary: '#8b5cf6' },
  rose:    { label: 'Rose',      primary: '#f43f5e' },
  emerald: { label: 'Smaragd',   primary: '#10b981' },
  amber:   { label: 'Bernstein', primary: '#f59e0b' },
  slate:   { label: 'Schiefer',  primary: '#64748b' },
};

const Themes = (() => {
  let _dark  = false;
  let _color = 'sky';

  /* ── Apply ─────────────────────────────────────────────────────── */
  function apply() {
    const root = document.documentElement;
    root.setAttribute('data-theme', _dark ? 'dark' : 'light');
    root.setAttribute('data-color', _color);

    // Keep toggle state in sync
    const toggle = document.getElementById('dark-toggle');
    const label  = document.getElementById('theme-mode-label');
    if (toggle) toggle.classList.toggle('on', _dark);
    if (label)  label.textContent = _dark ? 'Dunkel' : 'Hell';

    // Mark active color button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === _color);
    });

    Storage.set('prefs', { dark: _dark, color: _color });
  }

  /* ── Public API ────────────────────────────────────────────────── */
  function init() {
    const saved = Storage.get('prefs', { dark: false, color: 'sky' });
    _dark  = saved.dark;
    _color = saved.color;
    apply();
    _buildGrid();
    _bindToggle();
  }

  function toggleDark() {
    _dark = !_dark;
    apply();
  }

  function setColor(key) {
    if (!COLOR_THEMES[key]) return;
    _color = key;
    apply();
  }

  function getPrimary() {
    return COLOR_THEMES[_color]?.primary || '#0ea5e9';
  }

  /* ── Build colour theme grid in settings ───────────────────────── */
  function _buildGrid() {
    const grid = document.getElementById('color-theme-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(COLOR_THEMES).forEach(([key, theme]) => {
      const btn = document.createElement('button');
      btn.className  = 'theme-btn' + (_color === key ? ' active' : '');
      btn.dataset.color = key;
      btn.innerHTML  = `<div class="theme-dot" style="background:${theme.primary}"></div><div class="theme-name">${theme.label}</div>`;
      btn.onclick    = () => setColor(key);
      grid.appendChild(btn);
    });
  }

  /* ── Bind dark toggle button ───────────────────────────────────── */
  function _bindToggle() {
    const toggle = document.getElementById('dark-toggle');
    if (toggle) toggle.addEventListener('click', toggleDark);
  }

  return { init, toggleDark, setColor, getPrimary, COLOR_THEMES };
})();
