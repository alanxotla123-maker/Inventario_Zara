const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../front-end/bd/inventario_zara.json');
const PEDIDOS_PATH = path.resolve(__dirname, '../../front-end/bd/pedidos_zara.json');


const readData = () => {
    try {
        const data = fs.readFileSync(JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer JSON de inventario:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir JSON de inventario:', error);
    }
};

const readPedidos = () => {
    try {
        const data = fs.readFileSync(PEDIDOS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer JSON de pedidos:', error);
        return [];
    }
};

const writePedidos = (data) => {
    try {
        fs.writeFileSync(PEDIDOS_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir JSON de pedidos:', error);
    }
};

module.exports = { readData, writeData, JSON_PATH, readPedidos, writePedidos, PEDIDOS_PATH };
