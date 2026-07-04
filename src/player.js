const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class IPTVPlayer {
  constructor() {
    this.currentProcess = null;
    this.channels = [];
    this.lists = [];
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDir();
    this.loadLists();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Reproduz um URL de stream
   * @param {string} url - URL do stream
   */
  play(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida');
    }

    // Para qualquer reprodução anterior
    this.stop();

    try {
      // Tenta usar VLC se disponível
      if (process.platform === 'win32') {
        this.currentProcess = spawn('vlc', [url]);
      } else if (process.platform === 'darwin') {
        this.currentProcess = spawn('open', ['-a', 'VLC', url]);
      } else {
        this.currentProcess = spawn('vlc', [url]);
      }

      console.log(`▶️  Reproduzindo: ${url}`);
    } catch (error) {
      console.error('Erro ao iniciar VLC:', error.message);
      console.log('💡 Certifique-se de ter VLC instalado');
      throw error;
    }
  }

  /**
   * Para a reprodução atual
   */
  stop() {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      console.log('⏹️  Reprodução parada');
    }
  }

  /**
   * Define lista de canais
   * @param {Array} channels - Lista de canais
   */
  setChannels(channels) {
    this.channels = channels;
  }

  /**
   * Retorna lista de canais
   * @returns {Array}
   */
  getChannels() {
    return this.channels;
  }

  /**
   * Salva lista de canais
   * @param {string} name - Nome da lista
   * @param {Array} channels - Canais a salvar
   */
  saveList(name, channels) {
    const filePath = path.join(this.dataDir, `${name}.json`);
    const data = {
      name: name,
      channels: channels,
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Lista "${name}" salva em ${filePath}`);
    this.loadLists();
  }

  /**
   * Carrega lista salva
   * @param {string} name - Nome da lista
   * @returns {Array}
   */
  loadList(name) {
    const filePath = path.join(this.dataDir, `${name}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.channels = data.channels;
      console.log(`✅ Lista "${name}" carregada`);
      return data.channels;
    }
    throw new Error(`Lista "${name}" não encontrada`);
  }

  /**
   * Carrega todas as listas salvas
   */
  loadLists() {
    this.lists = [];
    if (fs.existsSync(this.dataDir)) {
      const files = fs.readdirSync(this.dataDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.dataDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.lists.push({
            name: data.name,
            count: data.channels.length,
            savedAt: data.savedAt
          });
        }
      });
    }
  }

  /**
   * Retorna todas as listas salvas
   * @returns {Array}
   */
  getLists() {
    return this.lists;
  }

  /**
   * Deleta uma lista salva
   * @param {string} name - Nome da lista
   */
  deleteList(name) {
    const filePath = path.join(this.dataDir, `${name}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Lista "${name}" deletada`);
      this.loadLists();
    }
  }
}

module.exports = IPTVPlayer;
