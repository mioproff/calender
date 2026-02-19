/* ═══════════════════════════════════════════════════════════════════
   storage.js – Thin localStorage wrapper with JSON support
═══════════════════════════════════════════════════════════════════ */

const Storage = (() => {
  const PREFIX = 'cal_';

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  return { get, set, remove };
})();
