# Guia de Monitoramento e Manutenção

Este guia contém instruções para monitorar, manter e solucionar problemas no servidor de atualizações do Acessos Pro.

## Monitoramento

### Métricas Importantes

| Métrica | Valor Normal | Alerta | Crítico | Ação Recomendada |
|---------|--------------|--------|---------|------------------|
| CPU     | <20%         | >50%   | >80%    | Investigar processos/aumentar recursos |
| Memória | <200MB       | >400MB | >500MB  | Verificar vazamentos/reiniciar |
| Espaço em Disco | <70% | >85%   | >95%    | Limpar logs/arquivos antigos |
| Tráfego | <50 req/s    | >100 req/s | >200 req/s | Verificar possível DDoS |

### Ferramentas de Monitoramento

1. **Dashboard do EasyPanel**
   - Fornece visualização básica de CPU, memória e disco
   - Visualize os logs em tempo real

2. **Logs da Aplicação**
   - `/app/logs/access.log` - Registra todas as requisições HTTP
   - `/app/logs/downloads.csv` - Estatísticas de download (quando habilitado)

3. **Monitoramento Externo**
   - Configure [Uptime Robot](https://uptimerobot.com/) para verificar o endpoint `/health`
   - Use [Grafana Cloud](https://grafana.com/products/cloud/) para monitoramento avançado

### Alertas Recomendados

Configure alertas para ser notificado quando:
- O servidor ficar offline por mais de 2 minutos
- Uso de CPU for superior a 80% por mais de 5 minutos
- Espaço em disco disponível for menor que 15%
- Mais de 5 requisições HTTP retornarem erro 500 em 1 minuto

## Manutenção

### Atualizando Instaladores

1. Prepare os novos instaladores com versões atualizadas
2. Faça backup dos instaladores atuais:
   ```bash
   mkdir -p /app/backups/$(date +%Y%m%d)
   cp -r /app/public/latest/* /app/backups/$(date +%Y%m%d)/
   ```
3. Faça upload dos novos instaladores para `/app/public/latest/`
4. Atualize as variáveis de ambiente ou o arquivo `.env`:
   ```
   VERSION=1.0.1
   RELEASE_DATE=2025-05-15
   RELEASE_NOTES=Corrige bugs e melhora desempenho
   ```
5. Reinicie o aplicativo para aplicar as mudanças nas variáveis

### Rotação de Logs

Os logs podem crescer significativamente. Configure um script para rotação:

```bash
#!/bin/bash
# Adicione ao cron: 0 0 * * * /app/rotate-logs.sh

LOG_DIR="/app/logs"
BACKUP_DIR="/app/logs/archive"
DATE=$(date +%Y%m%d)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Rotacionar access.log
if [ -f "$LOG_DIR/access.log" ]; then
  mv "$LOG_DIR/access.log" "$BACKUP_DIR/access-$DATE.log"
  touch "$LOG_DIR/access.log"
fi

# Compactar logs antigos (com mais de 7 dias)
find $BACKUP_DIR -type f -name "*.log" -mtime +7 -exec gzip {} \;

# Remover logs muito antigos (com mais de 30 dias)
find $BACKUP_DIR -type f -name "*.gz" -mtime +30 -delete
```

### Verificação de Integridade

Periodicamente, verifique a integridade dos instaladores:

```bash
#!/bin/bash
# Verificar se os instaladores estão íntegros e completos

INSTALLER_DIR="/app/public/latest"

# Tamanho mínimo esperado (em bytes) - ajuste conforme necessário
MIN_SIZE_WIN=20000000  # ~20MB
MIN_SIZE_MAC=20000000  # ~20MB
MIN_SIZE_LINUX=20000000  # ~20MB

# Verificar instalador Windows
WIN_INSTALLER="$INSTALLER_DIR/AcessosPro-Setup-1.0.0-win.exe"
if [ -f "$WIN_INSTALLER" ]; then
  SIZE=$(stat -c%s "$WIN_INSTALLER")
  if [ $SIZE -lt $MIN_SIZE_WIN ]; then
    echo "ALERTA: Instalador Windows pode estar corrompido ($SIZE bytes)"
  fi
else
  echo "ERRO: Instalador Windows não encontrado"
fi

# Adicionar verificações similares para macOS e Linux
```

## Solução de Problemas

### Servidor Não Inicia

**Problema**: EasyPanel mostra que o aplicativo está travado em "Starting"
**Solução**:
1. Verifique os logs no EasyPanel
2. Verifique se a porta configurada no código corresponde à exposta no EasyPanel
3. Tente reinstalar as dependências:
   ```bash
   npm ci --production
   ```
4. Verifique se package.json tem o script start correto

### Downloads Falham

**Problema**: Usuários relatam erro 404 ao tentar baixar
**Solução**:
1. Verifique os nomes dos arquivos no diretório `/app/public/latest/`
2. Confirme se os links no index.html correspondem aos nomes dos arquivos
3. Verifique permissões dos arquivos (devem ser legíveis)

### Desempenho Lento

**Problema**: Downloads estão lentos ou instáveis
**Solução**:
1. Verifique o uso de largura de banda no painel do servidor
2. Considere implementar limites de taxa para evitar abuso:
   ```javascript
   // Adicione ao server.js
   const rateLimit = require('express-rate-limit');
   
   const downloadLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 10, // limitar cada IP a 10 downloads por janela
     message: 'Muitos downloads deste IP, tente novamente mais tarde'
   });
   
   // Aplicar a rotas específicas
   app.use('/latest', downloadLimiter);
   ```
3. Considere usar um CDN na frente do servidor para grandes volumes

### Espaço em Disco Esgotado

**Problema**: Servidor sem espaço em disco
**Solução**:
1. Limpe arquivos temporários e logs antigos:
   ```bash
   rm -rf /tmp/*
   find /app/logs -type f -name "*.log" -mtime +7 -delete
   ```
2. Verifique arquivos grandes com:
   ```bash
   du -h -d 2 /app | sort -hr | head -10
   ```
3. Aumente o espaço em disco no EasyPanel se necessário
