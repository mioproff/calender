/* ═══════════════════════════════════════════════════════════════════
   events.js – Event CRUD via Supabase
═══════════════════════════════════════════════════════════════════ */

const EVENT_COLORS = [
  '#0ea5e9','#8b5cf6','#f43f5e','#10b981',
  '#f59e0b','#ec4899','#64748b','#ef4444',
];

const Events = (() => {
  let _list = [];

  /* ── Persistence ────────────────────────────────────────────────── */
  async function load() {
    const { data, error } = await Auth.getClient()
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (!error) _list = (data || []).map(_fromDb);
  }

  /* ── CRUD ───────────────────────────────────────────────────────── */
  function getAll()    { return [..._list]; }
  function getById(id) { return _list.find(e => e.id === id) || null; }

  function forDay(dateStr) {
    return _list.filter(e => e.date === dateStr);
  }

  async function add(data) {
    const { data: { user } } = await Auth.getClient().auth.getUser();

    const { data: inserted, error } = await Auth.getClient()
      .from('events')
      .insert([{ ..._toDb(data), user_id: user.id }])
      .select()
      .single();

    if (error) { console.error(error); return null; }
    const ev = _fromDb(inserted);
    _list.push(ev);
    return ev;
  }

  async function update(id, data) {
    const { error } = await Auth.getClient()
      .from('events')
      .update(_toDb(data))
      .eq('id', id);

    if (error) { console.error(error); return null; }
    const idx = _list.findIndex(e => e.id === id);
    if (idx >= 0) _list[idx] = { ..._list[idx], ...data, id };
    return _list[idx] ?? null;
  }

  async function remove(id) {
    await Auth.getClient()
      .from('events')
      .delete()
      .eq('id', id);

    _list = _list.filter(e => e.id !== id);
  }

  /* ── DB mapping ─────────────────────────────────────────────────── */
  // App-Namen → Datenbank-Spaltennamen
  function _toDb(ev) {
    return {
      title:     ev.title?.trim() || 'Kein Titel',
      date:      ev.date || _today(),
      time_from: ev.timeFrom || null,
      time_to:   ev.timeTo   || null,
      location:  ev.location?.trim() || null,
      notes:     ev.notes?.trim()    || null,
      color:     ev.color || EVENT_COLORS[0],
    };
  }

  // Datenbank-Spaltennamen → App-Namen
  function _fromDb(row) {
    return {
      id:       row.id,
      title:    row.title,
      date:     row.date,
      timeFrom: row.time_from || '',
      timeTo:   row.time_to   || '',
      location: row.location  || '',
      notes:    row.notes     || '',
      color:    row.color     || EVENT_COLORS[0],
    };
  }

  /* ── Modal helpers ──────────────────────────────────────────────── */
  function buildColorPicker(container, selectedColor) {
    container.innerHTML = '';
    EVENT_COLORS.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'color-swatch ripple' + (color === selectedColor ? ' active' : '');
      sw.style.background = color;
      sw.dataset.color = color;
      sw.title = color;
      sw.onclick = () => {
        container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      };
      container.appendChild(sw);
    });
  }

  function getPickedColor(container) {
    const active = container.querySelector('.color-swatch.active');
    return active ? active.dataset.color : EVENT_COLORS[0];
  }

  /* ── Util ───────────────────────────────────────────────────────── */
  function _today() {
    const d = new Date();
    return `${d.getFullYear()}-${_p(d.getMonth()+1)}-${_p(d.getDate())}`;
  }
  function _p(n) { return String(n).padStart(2, '0'); }

  return { load, getAll, getById, forDay, add, update, remove, buildColorPicker, getPickedColor, EVENT_COLORS };
})();
