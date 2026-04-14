const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Servir archivos estáticos apuntando a la carpeta front-end
app.use(express.static(path.join(__dirname, '../front-end')));

const TXT_PATH = path.join(__dirname, '../front-end/bd/inventario_zara.txt');

// API para leer el inventario
app.get('/api/inventario', (req, res) => {
    try {
        const data = fs.readFileSync(TXT_PATH, 'utf8');
        const lineas = data.trim().split('\n').filter(linea => linea.trim() !== '' && !linea.startsWith('ID'));
        const productos = lineas.map(linea => {
            const [id, nombre, gama, stock, demanda, temporada, img] = linea.split(',');
            return { id, nombre, gama, stock: parseInt(stock), demanda, temporada, img };
        });
        res.json(productos);
    } catch (e) {
        console.error("Error al leer el archivo txt:", e);
        res.status(500).send("Error al leer el archivo txt");
    }
});

// API para vender
app.post('/api/vender', (req, res) => {
    const { id } = req.body;
    let data = fs.readFileSync(TXT_PATH, 'utf8').trim().split('\n');

    let nuevaData = data.map(linea => {
        let campos = linea.split(',');
        if (campos[0] === id && parseInt(campos[3]) > 0) {
            campos[3] = parseInt(campos[3]) - 1;
        }
        return campos.join(',');
    });

    fs.writeFileSync(TXT_PATH, nuevaData.join('\n'));
    res.json({ success: true });
});

// Ruta principal para abrir el index.html que está en src/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../front-end/src/index.html'));
});

app.listen(3003, () => {
    console.log('✅ Sistema ZARA corriendo en http://localhost:3003');
    console.log('📂 Leyendo desde: ' + TXT_PATH);
});