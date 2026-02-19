const SUPABASE_URL = 'https://ysqzpvlktwpxnznhsqak.supabase.co'; // deine URL aus Schritt 4
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcXpwdmxrdHdweG56bmhzcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MjY3NTYsImV4cCI6MjA4NzEwMjc1Nn0.41AMASCwK4pB-ijcEcrXoYqVMLRR3uJzpyq7GD7hU6w';                   // dein anon key aus Schritt 4

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Auth = (() => {

  async function signUp(email, password) {
    const { data, error } = await _sb.auth.signUp({ email, password });
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    return _sb.auth.signOut();
  }

  function getCurrentUser() {
    // liest den lokal gespeicherten Login-Status aus
    const session = _sb.auth.session?.();
    return session?.user ?? null;
  }

  function getClient() {
    return _sb; // gibt die Supabase-Verbindung zurück, wird in events.js gebraucht
  }

  return { signUp, signIn, signOut, getCurrentUser, getClient };
})();