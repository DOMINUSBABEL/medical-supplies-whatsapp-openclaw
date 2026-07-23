const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'bot_config.json');

const DEFAULT_CONFIG = {
  companyName: 'Medical Supplies',
  botName: 'Asistente Virtual de Talento Humano',
  autoReplyMode: 'all', // 'all', 'whitelist', 'manual'
  whitelistNumbers: [], // e.g. ['573001234567']
  sessionTimeoutMinutes: 15,
  logLevel: 'verbose',
  welcomeGreeting: '👋 ¡Hola! Te damos la bienvenida al *Asistente Virtual de Talento Humano* de *Medical Supplies*.'
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } else {
        this.saveConfig();
      }
    } catch (err) {
      console.error('[ConfigManager] Error cargando configuración:', err.message);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (err) {
      console.error('[ConfigManager] Error guardando configuración:', err.message);
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  update(obj) {
    Object.assign(this.config, obj);
    this.saveConfig();
  }

  isNumberAuthorized(phoneNumber) {
    if (this.config.autoReplyMode === 'all') return true;
    if (this.config.autoReplyMode === 'whitelist') {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      return this.config.whitelistNumbers.some(num => cleanNumber.includes(num.replace(/\D/g, '')));
    }
    return false;
  }
}

module.exports = new ConfigManager();
