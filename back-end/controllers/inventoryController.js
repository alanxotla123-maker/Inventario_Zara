const { readData, writeData } = require('../config/database');

exports.getInventory = (req, res) => {
    const productos = readData();
    res.json(productos);
};

exports.addProduct = (req, res) => {
    console.log('--- Añadiendo Producto ---');
    const productos = readData();
    const nuevo = {
        ...req.body,
        stock: parseInt(req.body.stock)
    };
    productos.push(nuevo);
    writeData(productos);
    res.json({ success: true });
};

exports.sellProduct = (req, res) => {
    const { id } = req.body;
    const productos = readData();
    const index = productos.findIndex(p => p.id === id);
    
    if (index !== -1 && productos[index].stock > 0) {
        productos[index].stock -= 1;
        writeData(productos);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'No hay stock o producto no encontrado' });
    }
};
