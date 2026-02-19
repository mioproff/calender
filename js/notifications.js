/* ═══════════════════════════════════════════════════════════════════
   notifications.js – Browser push notifications & toast messages
═══════════════════════════════════════════════════════════════════ */

const Notifications = (() => {
  const _timers = new Map(); // eventId → timeoutId

  /* ── Permission ─────────────────────────────────────────────────── */
  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    const perm = await Notification.requestPermission();
    _updateUI(perm);
    return perm;
  }

  function getPermission() {
    return ('Notification' in window) ? Notification.permission : 'unsupported';
  }

  function _updateUI(perm) {
    const statusEl = document.getElementById('notif-status');
    const btn      = document.getElementById('btn-notif');
    if (statusEl) statusEl.textContent = perm === 'granted' ? '✅ Aktiviert' : perm === 'denied' ? '🚫 Verweigert' : 'Nicht aktiviert';
    if (btn) btn.style.display = perm === 'granted' ? 'none' : '';
  }

  function syncUI() { _updateUI(getPermission()); }

  /* ── Schedule notification for an event ─────────────────────────── */
  function schedule(ev) {
    if (!ev.timeFrom || getPermission() !== 'granted') return;

    // Cancel existing
    if (_timers.has(ev.id)) {
      clearTimeout(_timers.get(ev.id));
      _timers.delete(ev.id);
    }

    const dt = new Date(`${ev.date}T${ev.timeFrom}`);
    const ms = dt.getTime() - Date.now() - 5 * 60 * 1000; // 5 min before
    if (ms < 0) return;

    const tid = setTimeout(() => {
      new Notification(`📅 ${ev.title}`, {
        body: [ev.timeFrom, ev.location].filter(Boolean).join(' · '),
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
      _timers.delete(ev.id);
    }, ms);

    _timers.set(ev.id, tid);
  }

  function cancelAll() {
    _timers.forEach(t => clearTimeout(t));
    _timers.clear();
  }

  /* ── Toast messages (in-app) ─────────────────────────────────────── */
  let _toastContainer = null;

  function toast(message, type = 'success', duration = 3000) {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.className = 'toast-container';
      document.body.appendChild(_toastContainer);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    _toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  return { requestPermission, getPermission, syncUI, schedule, cancelAll, toast };
})();
