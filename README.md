# IPTV Player 📺

Um aplicativo moderno para reproduzir canais IPTV com interface intuitiva e suporte a múltiplas listas.

## Funcionalidades

✅ **Reprodução de Canais IPTV**
- Suporte a arquivos M3U
- Exibição de lista de canais
- Reprodução em tempo real

✅ **Gerenciamento de Listas**
- Importar listas de URLs
- Carregar arquivos M3U locais
- Favoritos

✅ **Interface Amigável**
- Design responsivo
- Busca de canais
- Controles de reprodução

## Requisitos

- Node.js 14+
- npm ou yarn
- Um player de vídeo (VLC ou navegador moderno)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/radiolagoazul7-commits/iptv.git
cd iptv

# Instale as dependências
npm install

# Inicie o aplicativo
npm start
```

## Uso

1. Abra o aplicativo
2. Importe uma lista M3U (URL ou arquivo local)
3. Selecione um canal da lista
4. Clique em reproduzir
5. O player abrirá no seu programa padrão

## Estrutura do Projeto

```
├── src/
│   ├── main.js           # Ponto de entrada
│   ├── player.js         # Lógica de reprodução
│   ├── parser.js         # Parser de M3U
│   └── ui.js             # Interface
├── public/
│   ├── index.html        # Página principal
│   └── style.css         # Estilos
├── package.json
└── README.md
```

## Formato de Lista M3U

As listas devem estar no formato M3U padrão:

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="1" tvg-name="Canal 1",Canal 1
http://url-do-stream-1
#EXTINF:-1 tvg-id="2" tvg-name="Canal 2",Canal 2
http://url-do-stream-2
```

## Licença

GNU General Public License v3.0

## Contribuições

Sugestões e pull requests são bem-vindos!
