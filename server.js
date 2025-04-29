/**
 * Servidor de Atualizações Acessos Pro
 * Responsável por fornecer instaladores para o sistema de auto-atualização
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

// Configurações
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || '1.0.0';
const RELEASE_DATE = process.env.RELEASE_DATE || '2025-04-28';
const RELEASE_NOTES = process.env.RELEASE_NOTES || 'Lançamento inicial do Acessos Pro';
const MAX_AGE = process.env.MAX_AGE || 86400; // 1 dia em segundos

// Criar pasta de logs se não existir
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Configurar logging
const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
);

// Middleware
app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.json());

// Configuração para servir arquivos estáticos
app.use(express.static('public', {
    maxAge: MAX_AGE * 1000, // Converter para milissegundos
    setHeaders: (res, path) => {
        // Configurar headers para arquivos de instalação
        if (path.endsWith('.exe') || path.endsWith('.dmg') || path.endsWith('.bin')) {
            res.setHeader('Content-Disposition', 'attachment');
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        // Adicionar CORS headers para permitir downloads de outros domínios
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}));

// Injetar dinamicamente informações de versão
app.get('/', (req, res, next) => {
    // Ler o arquivo index.html
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, data) => {
        if (err) {
            return next(err);
        }

        // Substituir as informações de versão
        const updatedHtml = data
            .replace('<span id="current-version">1.0.0</span>', `<span id="current-version">${VERSION}</span>`)
            .replace('<span id="release-date">28 de abril de 2025</span>', `<span id="release-date">${RELEASE_DATE}</span>`)
            .replace('<span id="release-notes">Lançamento inicial do Acessos Pro</span>', `<span id="release-notes">${RELEASE_NOTES}</span>`);

        // Enviar HTML atualizado
        res.send(updatedHtml);
    });
});

// Endpoint para verificar a saúde do aplicativo
app.get('/health', (req, res) => {
    const installerDir = path.join(__dirname, 'public', 'downloads/latest');
    const isReady = fs.existsSync(installerDir) &&
        fs.readdirSync(installerDir).length > 0;

    if (isReady) {
        res.status(200).json({
            status: 'OK',
            version: VERSION,
            uptime: process.uptime()
        });
    } else {
        res.status(503).json({
            status: 'ERROR',
            message: 'Instaladores não encontrados',
            uptime: process.uptime()
        });
    }
});

// Endpoint para estatísticas de download
app.post('/stats', (req, res) => {
    const { platform, version, status } = req.body;
    const timestamp = new Date().toISOString();

    // Registrar estatística
    const logEntry = `${timestamp},${platform},${version},${status}\n`;
    fs.appendFile(path.join(logDir, 'downloads.csv'), logEntry, (err) => {
        if (err) {
            console.error('Erro ao registrar estatística:', err);
        }
    });

    res.status(200).json({ received: true });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erro interno do servidor');
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);

    // Verificar se os instaladores existem
    const installerDir = path.join(__dirname, 'public', 'downloads/latest');
    if (!fs.existsSync(installerDir)) {
        console.warn('AVISO: Diretório de instaladores não encontrado:', installerDir);
        fs.mkdirSync(installerDir, { recursive: true });
    } else {
        const files = fs.readdirSync(installerDir);
        if (files.length === 0) {
            console.warn('AVISO: Nenhum instalador encontrado no diretório:', installerDir);
        } else {
            console.log('Instaladores disponíveis:', files.join(', '));
        }
    }
});