require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware Global
app.use(cors());
app.use(express.json());

// Rutas Estáticas
const FRONTEND_DIR = path.resolve(__dirname, '../front-end');
app.use(express.static(FRONTEND_DIR));

// Rutas de API
app.use('/api', apiRoutes);

// Ruta Principal (Frontend)
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'src/index.html'));
});

// Inicio del Servidor
app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR EDITORIAL INICIADO`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`📁 Estructura organizada por módulos\n`);
});