/* ═══════════════════════════════════════════════════════════════════
   app.js – Bootstrap: wires auth, calendar, sidebar, modals
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const authScreen = $('auth-screen');
  const appEl      = $('app');

  /* ═══ BOOT ════════════════════════════════════════════════════════ */
  async function boot() {
    Themes.init();
    Notifications.syncUI();
    _bindModalClose();
    _bindSettings();
    _bindNotifBtn();

    const user = Auth.getCurrentUser();
    if (user) {
      await Events.load();   // ← erst laden wenn eingeloggt
      _showApp(user);
    } else {
      _showAuth();
    }
  }

  /* ═══ AUTH ════════════════════════════════════════════════════════ */
  let _authMode = 'login';

  function _showAuth() {
    authScreen.classList.remove('hidden');
    appEl.classList.add('hidden');
  }

  async function _showApp(user) {
    authScreen.classList.add('hidden');
    appEl.classList.remove('hidden');

    const av = $('user-avatar');
    if (av) av.textContent = (user.email || 'D')[0].toUpperCase();

    Calendar.init({ onAdd: _openAddModal, onEdit: _openEditModal });
    Sidebar.init({ onEdit: _openEditModal, onAdd: () => _openAddModal({ date: _todayStr() }) });

    document.getElementById('btn-add-sidebar').onclick = () => _openAddModal({ date: _todayStr() });

    Events.getAll().forEach(Notifications.schedule);

    // Live-Refresh Sidebar jede Minute
    setInterval(() => Sidebar.render(), 60000);
  }

  function _bindAuth() {
    $('auth-submit').addEventListener('click', _submitAuth);
    $('auth-email').addEventListener('keydown',    e => e.key === 'Enter' && $('auth-password').focus());
    $('auth-password').addEventListener('keydown', e => e.key === 'Enter' && _submitAuth());
    $('auth-demo').addEventListener('click', () => {
      Storage.set('current_user', { id: 'demo', email: 'demo@example.com' });
      _showApp({ email: 'demo@example.com' });
    });
    $('auth-switch-link').addEventListener('click', () => {
      _authMode = _authMode === 'login' ? 'signup' : 'login';
      $('auth-heading').textContent     = _authMode === 'login' ? 'Willkommen zurück'        : 'Konto erstellen';
      $('auth-sub').textContent         = _authMode === 'login' ? 'Melde dich an …'          : 'Erstelle ein kostenloses Konto';
      $('auth-submit').textContent      = _authMode === 'login' ? 'Anmelden'                 : 'Registrieren';
      $('auth-switch-text').textContent = _authMode === 'login' ? 'Noch kein Konto?'         : 'Bereits registriert?';
      $('auth-switch-link').textContent = _authMode === 'login' ? 'Registrieren'             : 'Anmelden';
      $('auth-error').classList.add('hidden');
    });
  }

  async function _submitAuth() {
    const email = $('auth-email').value.trim();
    const pw    = $('auth-password').value;
    const errEl = $('auth-error');
    errEl.classList.add('hidden');
    if (!email || !pw) { errEl.textContent = 'Bitte alle Felder ausfüllen.'; errEl.classList.remove('hidden'); return; }
    const fn = _authMode === 'login' ? Auth.signIn : Auth.signUp;
    const { data, error } = await fn(email, pw);
    if (error) { errEl.textContent = error.message; errEl.classList.remove('hidden'); return; }
    await Events.load();   // ← Ereignisse nach Login laden
    _showApp(data.user);
  }

  /* ═══ NAV ═════════════════════════════════════════════════════════ */
  function _bindNav() {
    $('btn-prev').addEventListener('click',  () => Calendar.navigate(-1));
    $('btn-next').addEventListener('click',  () => Calendar.navigate(1));
    $('btn-today').addEventListener('click', () => Calendar.goToday());
    $('btn-logout').addEventListener('click', async () => { await Auth.signOut(); _showAuth(); });
    $('btn-goto').addEventListener('click', () => { $('goto-date').value = _todayStr(); _openModal('modal-goto'); });
    $('btn-goto-go').addEventListener('click', () => {
      const val = $('goto-date').value;
      if (val) { Calendar.goDate(new Date(val + 'T00:00:00')); _closeModal('modal-goto'); }
    });
    $('btn-add').addEventListener('click', () => _openAddModal({ date: _todayStr() }));
    $('btn-refresh').addEventListener('click', async () => {
  await Events.load();
  _refresh();
  Notifications.toast('Kalender aktualisiert ✓', 'success');
});
    $('btn-settings').addEventListener('click', () => _openModal('modal-settings'));
    document.querySelectorAll('.view-btn').forEach(btn =>
      btn.addEventListener('click', () => Calendar.setView(btn.dataset.view))
    );
  }

  function _bindSettings() { /* Farbthemen-Buttons werden von Themes.init() gebaut */ }

  function _bindNotifBtn() {
    const btn = $('btn-notif');
    if (btn) btn.addEventListener('click', async () => await Notifications.requestPermission());
  }

  /* ═══ EVENT MODAL ═════════════════════════════════════════════════ */
  function _openAddModal(prefill = {}) {
    $('modal-event-title').textContent = 'Neues Ereignis';
    $('ev-title').value    = '';
    $('ev-date').value     = prefill.date     || _todayStr();
    $('ev-from').value     = prefill.timeFrom || '';
    $('ev-to').value       = prefill.timeTo   || '';
    $('ev-location').value = '';
    $('ev-notes').value    = '';
    $('ev-delete').classList.add('hidden');
    $('ev-delete').onclick = null;
    $('ev-save').onclick   = () => _saveNewEvent();
    Events.buildColorPicker($('ev-color-picker'), Themes.getPrimary());
    _openModal('modal-event');
    setTimeout(() => $('ev-title').focus(), 50);
  }

  function _openEditModal(ev) {
    $('modal-event-title').textContent = 'Ereignis bearbeiten';
    $('ev-title').value    = ev.title    || '';
    $('ev-date').value     = ev.date     || _todayStr();
    $('ev-from').value     = ev.timeFrom || '';
    $('ev-to').value       = ev.timeTo   || '';
    $('ev-location').value = ev.location || '';
    $('ev-notes').value    = ev.notes    || '';
    Events.buildColorPicker($('ev-color-picker'), ev.color || Themes.getPrimary());
    const delBtn = $('ev-delete');
    delBtn.classList.remove('hidden');
    delBtn.onclick = async () => {
      await Events.remove(ev.id);    // ← await
      _closeModal('modal-event');
      _refresh();
      Notifications.toast('Ereignis gelöscht', 'success');
    };
    $('ev-save').onclick = () => _saveEditEvent(ev.id);
    _openModal('modal-event');
  }

  async function _saveNewEvent() {
    const title = $('ev-title').value.trim();
    if (!title) { $('ev-title').focus(); return; }
    const ev = await Events.add({   // ← await
      title,
      date:     $('ev-date').value,
      timeFrom: $('ev-from').value,
      timeTo:   $('ev-to').value,
      location: $('ev-location').value,
      notes:    $('ev-notes').value,
      color:    Events.getPickedColor($('ev-color-picker')),
    });
    if (ev) Notifications.schedule(ev);
    _closeModal('modal-event');
    _refresh();
    Notifications.toast('Ereignis gespeichert ✓', 'success');
  }

  async function _saveEditEvent(id) {
    const title = $('ev-title').value.trim();
    if (!title) { $('ev-title').focus(); return; }
    const ev = await Events.update(id, {   // ← await
      title,
      date:     $('ev-date').value,
      timeFrom: $('ev-from').value,
      timeTo:   $('ev-to').value,
      location: $('ev-location').value,
      notes:    $('ev-notes').value,
      color:    Events.getPickedColor($('ev-color-picker')),
    });
    if (ev) Notifications.schedule(ev);
    _closeModal('modal-event');
    _refresh();
    Notifications.toast('Änderungen gespeichert ✓', 'success');
  }

  function _refresh() {
    Calendar.refresh();
    Sidebar.render();
  }

  /* ═══ MODAL HELPERS ════════════════════════════════════════════════ */
  function _openModal(id)  { $(id).classList.remove('hidden'); }
  function _closeModal(id) { $(id).classList.add('hidden'); }

  function _bindModalClose() {
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) _closeModal(overlay.id); });
    });
    document.querySelectorAll('[data-close]').forEach(btn =>
      btn.addEventListener('click', () => _closeModal(btn.dataset.close))
    );
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.overlay:not(.hidden)').forEach(o => _closeModal(o.id));
    });
  }

  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  /* ═══ INIT ════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    _bindAuth();
    _bindNav();
  });
})();
