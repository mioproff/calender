/* ═══════════════════════════════════════════════════════════════════
   calendar.js – Renders Month / Week / Day views
═══════════════════════════════════════════════════════════════════ */

const DAYS_SHORT  = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const MONTHS_DE   = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const HOURS       = Array.from({ length: 24 }, (_, i) => i);

const Calendar = (() => {
  let _view     = 'month';   // month | week | day
  let _current  = new Date();
  let _selected = new Date();
  let _today    = new Date();
  let _onAdd    = () => {};
  let _onEdit   = () => {};

  /* ── Init ─────────────────────────────────────────────────────── */
  function init({ onAdd, onEdit }) {
    _onAdd  = onAdd;
    _onEdit = onEdit;
    _render();
  }

  /* ── Public navigation ────────────────────────────────────────── */
  function setView(view) { _view = view; _render(); }
  function navigate(dir) {
    const d = new Date(_current);
    if      (_view === 'month') d.setMonth(d.getMonth() + dir);
    else if (_view === 'week')  d.setDate(d.getDate() + dir * 7);
    else                        d.setDate(d.getDate() + dir);
    _current = d;
    _render();
  }
  function goToday() { _current = new Date(_today); _selected = new Date(_today); _render(); }
  function goDate(date) { _current = new Date(date); _selected = new Date(date); _render(); }
  function refresh() { _render(); }

  /* ── Header label ─────────────────────────────────────────────── */
  function _headerLabel() {
    if (_view === 'month')
      return `${MONTHS_DE[_current.getMonth()]} ${_current.getFullYear()}`;
    if (_view === 'week') {
      const ws = _weekStart(_current);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.getDate()}. – ${we.getDate()}. ${MONTHS_DE[ws.getMonth()]} ${ws.getFullYear()}`;
    }
    return `${_current.getDate()}. ${MONTHS_DE[_current.getMonth()]} ${_current.getFullYear()}`;
  }

  /* ── Render dispatcher ────────────────────────────────────────── */
  function _render() {
    const main = document.getElementById('main');
    if (!main) return;

    // Update header
    const lbl = document.getElementById('header-label');
    if (lbl) lbl.textContent = _headerLabel();

    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.view === _view)
    );

    main.innerHTML = '';
    if      (_view === 'month') main.appendChild(_buildMonth());
    else if (_view === 'week')  main.appendChild(_buildWeek());
    else                        main.appendChild(_buildDay());
  }

  /* ══ MONTH VIEW ══════════════════════════════════════════════════ */
  function _buildMonth() {
    const year  = _current.getFullYear();
    const month = _current.getMonth();
    const first = new Date(year, month, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const total  = new Date(year, month + 1, 0).getDate();

    const wrap = _el('div', 'cal-wrap');
    // Day headers
    const head = _el('div', 'month-head');
    DAYS_SHORT.forEach(d => head.appendChild(_el('div', 'month-head-cell', d)));
    wrap.appendChild(head);

    const grid = _el('div', 'month-grid');

    // Empty cells
    for (let i = 0; i < offset; i++) grid.appendChild(_el('div', 'month-cell month-cell--empty'));

    // Day cells
    for (let day = 1; day <= total; day++) {
      const date    = new Date(year, month, day);
      const dateStr = _fmt(date);
      const isToday = _sameDay(date, _today);
      const isSel   = _sameDay(date, _selected);

      const cell = _el('div', 'month-cell ripple' +
        (isToday ? ' month-cell--today' : '') +
        (isSel   ? ' month-cell--selected' : ''));
      cell.onclick      = ()  => { _selected = date; _render(); };
      cell.ondblclick   = ()  => _onAdd({ date: dateStr });

      const numEl = _el('div', 'day-num', String(day));
      cell.appendChild(numEl);

      const evBox = _el('div', 'month-events');
      const evs   = Events.forDay(dateStr);
      evs.slice(0, 3).forEach(ev => {
        const chip = _evChip(ev);
        evBox.appendChild(chip);
      });
      if (evs.length > 3) {
        const more = _el('div', 'month-more', `+${evs.length - 3} weitere`);
        evBox.appendChild(more);
      }
      cell.appendChild(evBox);
      grid.appendChild(cell);
    }

    wrap.appendChild(grid);
    return wrap;
  }

  /* ══ WEEK VIEW ═══════════════════════════════════════════════════ */
  function _buildWeek() {
    const ws   = _weekStart(_current);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });

    const wrap = _el('div', 'cal-wrap week-wrap');

    // Header row
    const headRow = _el('div', 'week-head-row');
    headRow.appendChild(_el('div', 'week-head-gutter'));
    days.forEach((d, i) => {
      const isT  = _sameDay(d, _today);
      const cell = _el('div', 'week-head-cell' + (isT ? ' today' : ''));
      cell.onclick = () => { _selected = d; };
      cell.innerHTML = `<div class="week-day-label">${DAYS_SHORT[i]}</div>
                        <div class="week-day-num">${d.getDate()}</div>`;
      headRow.appendChild(cell);
    });
    wrap.appendChild(headRow);

    // Hour rows
    HOURS.forEach(h => {
      const row = _el('div', 'week-hour-row');
      const gutter = _el('div', 'week-hour-gutter', h === 0 ? '' : `${String(h).padStart(2,'0')}:00`);
      row.appendChild(gutter);

      days.forEach(d => {
        const cell = _el('div', 'week-hour-cell');
        cell.onclick = () => _onAdd({ date: _fmt(d), timeFrom: `${String(h).padStart(2,'0')}:00`, timeTo: `${String(h+1).padStart(2,'0')}:00` });

        Events.forDay(_fmt(d))
          .filter(ev => ev.timeFrom && parseInt(ev.timeFrom) === h)
          .forEach(ev => {
            const chip = _evChip(ev, true);
            cell.appendChild(chip);
          });

        row.appendChild(cell);
      });
      wrap.appendChild(row);
    });

    return wrap;
  }

  /* ══ DAY VIEW ════════════════════════════════════════════════════ */
  function _buildDay() {
    const dateStr = _fmt(_current);
    const isToday = _sameDay(_current, _today);
    const dayEvs  = Events.forDay(dateStr);

    const wrap   = _el('div', 'cal-wrap');
    const header = _el('div', 'day-header');

    const badge = _el('div', 'day-badge' + (isToday ? ' today' : ''));
    badge.innerHTML = `<div class="day-num-lg">${_current.getDate()}</div>
                       <div class="day-mon-sm">${MONTHS_DE[_current.getMonth()].slice(0,3)}</div>`;
    header.appendChild(badge);

    const info = _el('div');
    info.innerHTML = `<strong>${DAYS_SHORT[(_current.getDay() + 6) % 7]}., ${_current.getDate()}. ${MONTHS_DE[_current.getMonth()]} ${_current.getFullYear()}</strong>
                      <div style="font-size:12px;color:var(--sub)">${dayEvs.length} Ereignis${dayEvs.length !== 1 ? 'se' : ''}</div>`;
    header.appendChild(info);
    wrap.appendChild(header);

    HOURS.forEach(h => {
      const row   = _el('div', 'day-hour-row');
      const label = _el('div', 'day-hour-label', `${String(h).padStart(2,'0')}:00`);
      const body  = _el('div', 'day-hour-body');
      body.onclick = () => _onAdd({ date: dateStr, timeFrom: `${String(h).padStart(2,'0')}:00`, timeTo: `${String(h+1).padStart(2,'0')}:00` });

      dayEvs.filter(ev => ev.timeFrom && parseInt(ev.timeFrom) === h)
        .forEach(ev => {
          const chip = _el('div', 'ev-chip-lg ripple');
          chip.style.background = ev.color || Themes.getPrimary();
          chip.innerHTML = `<span>${ev.title}</span>${ev.location ? `<span style="font-size:10px;opacity:.8">📍 ${ev.location}</span>` : ''}`;
          chip.onclick = e => { e.stopPropagation(); _onEdit(ev); };
          body.appendChild(chip);
        });

      row.appendChild(label);
      row.appendChild(body);
      wrap.appendChild(row);
    });

    return wrap;
  }

  /* ── Shared event chip ────────────────────────────────────────── */
  function _evChip(ev, small = false) {
    const chip = _el('div', small ? 'ev-chip' : 'ev-chip');
    chip.style.background = ev.color || Themes.getPrimary();
    chip.textContent = (ev.timeFrom ? ev.timeFrom + ' ' : '') + ev.title;
    chip.onclick = e => { e.stopPropagation(); _onEdit(ev); };
    return chip;
  }

  /* ── DOM helpers ──────────────────────────────────────────────── */
  function _el(tag, className = '', text = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function _sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }
  function _weekStart(date) {
    const d   = new Date(date);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
  }
  function _fmt(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  return { init, setView, navigate, goToday, goDate, refresh };
})();
