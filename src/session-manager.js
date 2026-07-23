const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '..', 'user_sessions.json');
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.loadSessions();
  }

  loadSessions() {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const raw = fs.readFileSync(SESSION_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [jid, session] of Object.entries(data)) {
          this.sessions.set(jid, session);
        }
      }
    } catch (err) {
      console.error('[SessionManager] Error cargando sesiones:', err.message);
    }
  }

  saveSessions() {
    try {
      const obj = {};
      for (const [jid, session] of this.sessions.entries()) {
        obj[jid] = session;
      }
      fs.writeFileSync(SESSION_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('[SessionManager] Error guardando sesiones:', err.message);
    }
  }

  getSession(jid) {
    let session = this.sessions.get(jid);
    const now = Date.now();

    if (!session || (now - session.lastActivity > SESSION_TIMEOUT_MS)) {
      session = {
        jid,
        flowState: 'welcome',
        currentCategory: 'welcome',
        employee: null,
        tempData: {},
        lastActivity: now
      };
      this.sessions.set(jid, session);
      this.saveSessions();
    } else {
      session.lastActivity = now;
    }

    return session;
  }

  updateSession(jid, updates) {
    const session = this.getSession(jid);
    Object.assign(session, updates, { lastActivity: Date.now() });
    this.sessions.set(jid, session);
    this.saveSessions();
    return session;
  }

  resetSession(jid) {
    const session = {
      jid,
      flowState: 'welcome',
      currentCategory: 'welcome',
      employee: null,
      tempData: {},
      lastActivity: Date.now()
    };
    this.sessions.set(jid, session);
    this.saveSessions();
    return session;
  }
}

module.exports = new SessionManager();
