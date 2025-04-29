# app-desktop-releases

### Instaladores App Desktop Acessos Pro

# Servidor de Atualizações Acessos Pro

Um servidor simples dedicado a fornecer atualizações automáticas para o Aplicativo Desktop Acessos Pro.

## 📋 Visão Geral

Este servidor é responsável por hospedar e fornecer os arquivos de instalação atualizados para a funcionalidade de auto-atualização do aplicativo Acessos Pro. Ele oferece:

- Interface web simples para downloads manuais
- Endpoints otimizados para o processo de auto-atualização
- Gerenciamento eficiente de arquivos grandes

## 🔧 Requisitos

- Node.js 16.x ou superior
- NPM 7.x ou superior
- 200MB+ de espaço em disco para os instaladores
- Largura de banda suficiente (recomendado: mínimo 10 Mbps)
- EasyPanel para implantação (opcional, mas recomendado)

## 🚀 Instalação

### Usando EasyPanel (Recomendado)

1. No dashboard do EasyPanel, clique em "Create App"
2. Selecione o template "Node.js"
3. Configure:
   - **Nome**: acessospro-updates
   - **Domínio**: updates.acessospro.app (ou seu domínio personalizado)
   - **Repositório Git**: (Opcional) Configure o repositório para implantação automática

### Instalação Manual

```bash
# Clonar o repositório (ou criar manualmente)
git clone https://github.com/acessospro/update-server.git
cd update-server

# Instalar dependências
npm install

# Iniciar o servidor
npm start
```

## ⚙️ Configuração

### Arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```
PORT=3000
NODE_ENV=production
MAX_AGE=86400
VERSION=1.0.0
RELEASE_DATE=2025-04-28
RELEASE_NOTES=Lançamento inicial do Acessos Pro
```

### Configuração do EasyPanel

Para otimizar o EasyPanel para arquivos grandes, adicione estas configurações em "Configurações > Avançado":

```yaml
nginx:
  client_max_body_size: 150m
  proxy_read_timeout: 300
  proxy_send_timeout: 300
```

## 📁 Estrutura do Projeto

```
/
├── server.js           # Ponto de entrada principal
├── package.json        # Configurações do projeto
├── .env                # Variáveis de ambiente
├── public/             # Arquivos estáticos públicos
│   ├── index.html      # Página de downloads
│   └── downloads/latest/   # Pasta com os instaladores mais recentes
│                   ├── AcessosPro-Setup-1.0.0-win.exe
│                   ├── AcessosPro-Setup-1.0.0-mac.dmg
│                   └── AcessosPro-Setup-1.0.0-linux.bin
└── logs/               # Arquivos de log (gerados automaticamente)
```

## 🖥️ Uso

### Endpoints Disponíveis

- **/** - Página inicial com links para download manual
- **/latest/[platform].[ext]** - Download direto dos instaladores
- **/health** - Endpoint de verificação de saúde para monitoramento

### Adicionando Novos Instaladores

1. Gere novos instaladores a partir do projeto principal
2. Faça upload dos instaladores para a pasta `/public/latest/` usando SFTP ou Git
3. Mantenha os nomes de arquivos consistentes ou atualize os links no `index.html`
4. Atualize a versão e notas no arquivo `.env` (ou manualmente no HTML)

## 🔄 Manutenção

### Monitoramento

Você pode monitorar o desempenho do servidor usando:

- Dashboard do EasyPanel para uso de recursos
- Logs do aplicativo em `/logs`
- Ferramentas externas como Uptime Robot para monitoramento de disponibilidade

### Backups

Recomendamos manter backups dos instaladores:

```bash
# Script para backup automático
mkdir -p /backups/acessospro/$(date +%Y%m%d)
cp -r /app/public/latest/* /backups/acessospro/$(date +%Y%m%d)/
```

## ❓ Solução de Problemas

### Problemas Comuns

1. **Erro SIGTERM**
   - Problema: Servidor fechando inesperadamente
   - Solução: Verifique se está escutando a porta correta (use `process.env.PORT`)

2. **Arquivos muito grandes**
   - Problema: Falha ao fazer upload/download de instaladores
   - Solução: Aumente as configurações de tamanho máximo no Nginx/Traefik

3. **Downloads lentos**
   - Problema: Usuários relatam downloads lentos
   - Solução: Verifique largura de banda do servidor ou considere usar um CDN

### Logs de Diagnóstico

Para ativar logs detalhados, modifique o arquivo `server.js`:

```javascript
// Adicione esta linha ao server.js
app.use(require('morgan')('combined'));
```

## 📝 Integração com o Sistema Principal

Este servidor de atualizações deve ser referenciado no servidor principal de API:

```javascript
// No config.js do servidor principal
export default {
  // ...outras configurações
  update: {
    serverUrl: 'https://updates.acessospro.app',
    latest: {
      version: '1.0.0',
      // ...outras configurações
    }
  }
}
```

## 📄 Licença

© 2025 Acessos Pro - Todos os direitos reservados.
Este software é proprietário e seu uso é restrito aos termos acordados.
