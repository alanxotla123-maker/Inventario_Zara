const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../front-end/bd/inventario_zara.json');
const VENTAS_JSON_PATH = path.resolve(__dirname, '../../front-end/bd/ventas.json');

const readData = () => {
    try {
        const data = fs.readFileSync(JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer JSON:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir JSON:', error);
    }
};

const readVentas = () => {
    try {
        const data = fs.readFileSync(VENTAS_JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer ventas JSON:', error);
        return [];
    }
};

const writeVentas = (data) => {
    try {
        fs.writeFileSync(VENTAS_JSON_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir ventas JSON:', error);
    }
};

module.exports = { readData, writeData, JSON_PATH, readVentas, writeVentas };
