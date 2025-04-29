const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar para servir arquivos grandes
app.use(express.static('public', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.exe') || path.endsWith('.dmg') || path.endsWith('.bin')) {
            res.setHeader('Content-Disposition', 'attachment');
        }
    }
}));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});