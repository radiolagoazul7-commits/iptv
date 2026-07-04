const axios = require('axios');

class M3UParser {
  /**
   * Faz parse de uma URL M3U
   * @param {string} url - URL da lista M3U
   * @returns {Promise<Array>}
   */
  async parseFromUrl(url) {
    try {
      console.log(`🔍 Baixando lista de: ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'IPTV-Player/1.0'
        }
      });
      return this.parseFromContent(response.data);
    } catch (error) {
      console.error(`❌ Erro ao baixar lista: ${error.message}`);
      throw new Error(`Erro ao baixar lista: ${error.message}`);
    }
  }

  /**
   * Faz parse do conteúdo M3U
   * @param {string} content - Conteúdo do arquivo M3U
   * @returns {Array}
   */
  parseFromContent(content) {
    const channels = [];
    const lines = content.split('\n');
    
    let currentInfo = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ignora linhas vazias e comentários
      if (!line || line.startsWith('#EXTM3U')) {
        continue;
      }

      // Processa linhas de informação do canal
      if (line.startsWith('#EXTINF:')) {
        currentInfo = this.parseExtinf(line);
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        // Adiciona o canal se tivermos informação anterior
        if (currentInfo) {
          channels.push({
            ...currentInfo,
            url: line
          });
          currentInfo = null;
        } else {
          // Se não houver informação, usa a URL como nome
          channels.push({
            name: line,
            id: null,
            group: 'Sem categoria',
            logo: null,
            url: line
          });
        }
      }
    }

    console.log(`✅ ${channels.length} canais encontrados`);
    return channels;
  }

  /**
   * Faz parse de uma linha EXTINF
   * @param {string} line - Linha EXTINF
   * @returns {Object}
   */
  parseExtinf(line) {
    // Formato: #EXTINF:-1 tvg-id="123" tvg-name="Nome" tvg-logo="url" group-title="Grupo",Nome do Canal
    
    const info = {
      name: 'Canal',
      id: null,
      group: 'Sem categoria',
      logo: null
    };

    // Extrai tvg-id
    const idMatch = line.match(/tvg-id="([^"]*)"/i);
    if (idMatch) info.id = idMatch[1];

    // Extrai tvg-name
    const nameMatch = line.match(/tvg-name="([^"]*)"/i);
    if (nameMatch) info.name = nameMatch[1];

    // Extrai tvg-logo
    const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
    if (logoMatch) info.logo = logoMatch[1];

    // Extrai group-title
    const groupMatch = line.match(/group-title="([^"]*)"/i);
    if (groupMatch) info.group = groupMatch[1];

    // Extrai nome após a vírgula (se houver)
    const nameAfterComma = line.split(',').pop().trim();
    if (nameAfterComma) info.name = nameAfterComma;

    return info;
  }
}

module.exports = M3UParser;
