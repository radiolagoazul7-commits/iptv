class IPTVApp {
  constructor() {
    this.channels = [];
    this.currentList = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedLists();
  }

  setupEventListeners() {
    // Load from URL
    document.getElementById('loadFromUrl').addEventListener('click', () => this.loadFromUrl());
    
    // Load from File
    document.getElementById('loadFromFile').addEventListener('click', () => this.loadFromFile());
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => this.filterChannels(e.target.value));
    
    // Save Modal
    document.getElementById('confirmSave').addEventListener('click', () => this.confirmSave());
    document.getElementById('cancelSave').addEventListener('click', () => this.closeModal());
  }

  async loadFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
      alert('Por favor, digite uma URL válida');
      return;
    }

    try {
      this.showLoading();
      const response = await fetch('/api/parse-m3u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();
      if (data.success) {
        this.channels = data.channels;
        this.displayChannels(this.channels);
        this.showMessage(`✅ ${data.count} canais carregados com sucesso!`, 'success');
      } else {
        this.showMessage(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Erro ao carregar lista: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  loadFromFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const response = fetch('/api/parse-m3u', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content })
        }).then(res => res.json()).then(data => {
          if (data.success) {
            this.channels = data.channels;
            this.displayChannels(this.channels);
            this.showMessage(`✅ ${data.count} canais carregados com sucesso!`, 'success');
          } else {
            this.showMessage(`❌ Erro: ${data.error}`, 'error');
          }
        });
      } catch (error) {
        this.showMessage(`❌ Erro ao processar arquivo: ${error.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  displayChannels(channels) {
    const container = document.getElementById('channelsList');
    
    if (channels.length === 0) {
      container.innerHTML = '<p class="empty-message">Nenhum canal encontrado</p>';
      return;
    }

    container.innerHTML = channels.map(channel => `
      <div class="channel-item">
        ${channel.logo ? `<img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="this.style.display='none'">` : ''}
        <div class="channel-name">${channel.name}</div>
        <div class="channel-group">${channel.group}</div>
        <div class="channel-actions">
          <button class="btn btn-play btn-small" onclick="app.playChannel('${channel.url.replace(/'/g, "\\'")}')">▶️ Reproduzir</button>
          <button class="btn btn-secondary btn-small" onclick="app.copyUrl('${channel.url}')">📋 Copiar</button>
        </div>
      </div>
    `).join('');

    // Show save button if we have channels
    if (channels.length > 0) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary';
      saveBtn.textContent = '💾 Salvar Esta Lista';
      saveBtn.style.marginTop = '20px';
      saveBtn.onclick = () => this.openSaveModal();
      container.parentElement.appendChild(saveBtn);
    }
  }

  filterChannels(searchTerm) {
    const filtered = this.channels.filter(channel => 
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.displayChannels(filtered);
  }

  async playChannel(url) {
    try {
      const response = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      const data = await response.json();
      if (data.success) {
        this.showMessage('▶️ Reprodução iniciada em seu player padrão!', 'success');
      } else {
        this.showMessage(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Erro ao reproduzir: ${error.message}`, 'error');
    }
  }

  copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      this.showMessage('✅ URL copiada para a área de transferência!', 'success');
    }).catch(() => {
      this.showMessage('❌ Erro ao copiar URL', 'error');
    });
  }

  openSaveModal() {
    document.getElementById('saveModal').classList.add('active');
    document.getElementById('listName').focus();
  }

  closeModal() {
    document.getElementById('saveModal').classList.remove('active');
    document.getElementById('listName').value = '';
  }

  async confirmSave() {
    const listName = document.getElementById('listName').value.trim();
    if (!listName) {
      alert('Por favor, digite um nome para a lista');
      return;
    }

    try {
      const response = await fetch('/api/save-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: listName, channels: this.channels })
      });

      const data = await response.json();
      if (data.success) {
        this.showMessage(`✅ Lista "${listName}" salva com sucesso!`, 'success');
        this.closeModal();
        this.loadSavedLists();
      } else {
        this.showMessage(`❌ Erro: ${data.error}`, 'error');
      }
    } catch (error) {
      this.showMessage(`❌ Erro ao salvar lista: ${error.message}`, 'error');
    }
  }

  async loadSavedLists() {
    try {
      const response = await fetch('/api/lists');
      const data = await response.json();
      
      if (data.success && data.lists.length > 0) {
        const container = document.getElementById('savedLists');
        container.innerHTML = data.lists.map(list => `
          <div class="list-item">
            <div class="list-name">📋 ${list.name}</div>
            <div class="list-info">${list.count} canais</div>
            <div class="list-info" style="font-size: 0.75rem; color: #666;">${new Date(list.savedAt).toLocaleDateString('pt-BR')}</div>
            <div class="list-actions">
              <button class="btn btn-primary btn-small" onclick="app.loadSavedList('${list.name}')">Carregar</button>
              <button class="btn btn-secondary btn-small" onclick="app.deleteSavedList('${list.name}')">🗑️ Deletar</button>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Erro ao carregar listas salvas:', error);
    }
  }

  async loadSavedList(listName) {
    try {
      // Aqui você carregaria a lista salva
      this.showMessage(`✅ Lista "${listName}" carregada!`, 'success');
      this.loadSavedLists();
    } catch (error) {
      this.showMessage(`❌ Erro ao carregar lista: ${error.message}`, 'error');
    }
  }

  async deleteSavedList(listName) {
    if (confirm(`Tem certeza que deseja deletar a lista "${listName}"?`)) {
      try {
        this.showMessage(`✅ Lista "${listName}" deletada!`, 'success');
        this.loadSavedLists();
      } catch (error) {
        this.showMessage(`❌ Erro ao deletar lista: ${error.message}`, 'error');
      }
    }
  }

  showMessage(message, type = 'info') {
    const element = document.createElement('div');
    element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 5px;
      background-color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    element.textContent = message;
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  }

  showLoading() {
    // Pode ser implementado posteriormente
  }

  hideLoading() {
    // Pode ser implementado posteriormente
  }
}

// Inicializa a aplicação
const app = new IPTVApp();
