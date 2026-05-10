const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../front-end/bd/inventario_zara.json');
const VENTAS_JSON_PATH = path.resolve(__dirname, '../../front-end/bd/ventas.json');
const PEDIDOS_JSON_PATH = path.resolve(__dirname, '../../front-end/bd/pedidos.json');

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

const readPedidos = () => {
    try {
        if (!fs.existsSync(PEDIDOS_JSON_PATH)) {
            fs.writeFileSync(PEDIDOS_JSON_PATH, JSON.stringify([]));
        }
        const data = fs.readFileSync(PEDIDOS_JSON_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer pedidos JSON:', error);
        return [];
    }
};

const writePedidos = (data) => {
    try {
        fs.writeFileSync(PEDIDOS_JSON_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir pedidos JSON:', error);
    }
};

module.exports = { readData, writeData, JSON_PATH, readVentas, writeVentas, readPedidos, writePedidos };
