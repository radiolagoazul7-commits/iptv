#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const IPTVPlayer = require('./player');
const M3UParser = require('./parser');

const app = express();
const player = new IPTVPlayer();
const parser = new M3UParser();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API

// Endpoint para parsear uma lista M3U
app.post('/api/parse-m3u', async (req, res) => {
  try {
    const { url, content } = req.body;

    let channels;
    if (url) {
      channels = await parser.parseFromUrl(url);
    } else if (content) {
      channels = parser.parseFromContent(content);
    } else {
      return res.status(400).json({ error: 'URL ou conteúdo é obrigatório' });
    }

    res.json({
      success: true,
      count: channels.length,
      channels: channels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obter lista de canais
app.get('/api/channels', (req, res) => {
  const channels = player.getChannels();
  res.json({
    success: true,
    channels: channels
  });
});

// Endpoint para reproduzir um canal
app.post('/api/play', (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    player.play(url);
    res.json({
      success: true,
      message: 'Reprodução iniciada',
      url: url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para parar reprodução
app.post('/api/stop', (req, res) => {
  try {
    player.stop();
    res.json({
      success: true,
      message: 'Reprodução parada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para salvar lista
app.post('/api/save-list', (req, res) => {
  try {
    const { name, channels } = req.body;
    player.saveList(name, channels);
    res.json({
      success: true,
      message: 'Lista salva com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para listar salvas
app.get('/api/lists', (req, res) => {
  try {
    const lists = player.getLists();
    res.json({
      success: true,
      lists: lists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Servir index.html para rotas desconhecidas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎬 IPTV Player rodando em http://localhost:${PORT}`);
  console.log(`📺 Abra seu navegador e acesse http://localhost:${PORT}\n`);
});

module.exports = app;
